import React, { useEffect, useState } from 'react';
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
} from '@ant-design/icons';
import { Avatar, Tag, Spin, Form, Input, Select, Switch, Radio } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { Customer } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import {
  AppCard,
  AppTable,
  AppButton,
  AppInput,
  AppModal,
  PageHeader,
  TableSkeleton,
} from 'shared-components';

export const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<Customer | null>(null);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();
  const selectedRole = Form.useWatch('role', form);
  const { showToast } = useToast();

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await ecommerceService.getCustomers({
        search: searchQuery,
        role: selectedRoleFilter !== 'all' ? selectedRoleFilter : undefined,
      });
      if (res.success && res.data) {
        setCustomers(res.data);
      }
    } catch {
      showToast('Error loading user & customer directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [selectedRoleFilter]);

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

  const totalSpendAll = customers.reduce((acc, c) => acc + (c.totalSpend || 0), 0);
  const totalOrdersAll = customers.reduce((acc, c) => acc + (c.ordersCount || 0), 0);
  const sellersCount = customers.filter((c) => c.role === 'seller').length;
  const customersCount = customers.filter((c) => c.role === 'customer' || c.role === 'user').length;

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="User & Customer Directory"
        description="Comprehensive directory of registered customers, authorized sellers/vendors, and staff accounts."
        breadcrumbs={[{ label: 'Admin', path: '/admin' }, { label: 'Customers & Sellers' }]}
      />

      {/* Customer Overview Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Buyers (Customers)
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{customersCount}</div>
          <div className="text-xs text-slate-400 mt-1">Verified buyer accounts</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Sellers / Stores
          </div>
          <div className="text-2xl font-bold text-orange-600 mt-2">{sellersCount}</div>
          <div className="text-xs text-slate-400 mt-1">Authorized store vendors</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Orders Placed
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalOrdersAll}</div>
          <div className="text-xs text-slate-400 mt-1">Across all active accounts</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Cumulative Revenue
          </div>
          <div className="text-2xl font-bold text-[#0284c7] mt-2">
            ${totalSpendAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">Lifetime platform volume</div>
        </div>
      </div>

      {/* Filter, Search Bar, and Action on Right */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 w-full">
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="w-full sm:w-[250px] max-w-[250px] shrink-0">
            <AppInput
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              allowClear
            />
          </form>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { key: 'all', label: 'All Accounts', icon: null },
              { key: 'customer', label: 'Customers', icon: <ShoppingOutlined /> },
              { key: 'seller', label: 'Sellers / Vendors', icon: <ShopOutlined /> },
              { key: 'support', label: 'Support', icon: <CustomerServiceOutlined /> },
              { key: 'manager', label: 'Managers', icon: <AppstoreOutlined /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedRoleFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                  selectedRoleFilter === tab.key
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <AppButton
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.setFieldsValue({ role: 'customer', agreementAccepted: true });
            setIsModalOpen(true);
          }}
          className="shrink-0"
          style={{ backgroundColor: '#0284c7' }}
        >
          Add User / Seller
        </AppButton>
      </div>

      {/* Directory Table */}
      <AppCard bodyStyle={{ padding: 0 }}>
        <AppTable>
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
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    No accounts found matching search or filter.
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
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
                        <Tag color={c.isActive !== false ? 'success' : 'default'} className="font-semibold text-[11px] px-2.5 py-0.5 rounded-full capitalize">
                          {c.isActive !== false ? 'Active' : 'Inactive'}
                        </Tag>
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <AppButton
                          size="small"
                          icon={isSellerAccount ? <ShopOutlined /> : <EyeOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingUser(c);
                          }}
                        >
                          {isSellerAccount ? 'Vendor Profile' : 'View Profile'}
                        </AppButton>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
        </AppTable>
      </AppCard>

      {/* Add New Customer / Seller Modal (Top-10 Positioned with smooth animation) */}
      <AppModal
        title="Register Platform User / Seller"
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
            initialValue="customer"
            rules={[{ required: true }]}
          >
            <Radio.Group buttonStyle="solid" className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <Radio.Button value="customer" className="text-center font-medium">
                <ShoppingOutlined className="mr-1" /> Buyer
              </Radio.Button>
              <Radio.Button value="seller" className="text-center font-medium">
                <ShopOutlined className="mr-1" /> Seller
              </Radio.Button>
              <Radio.Button value="support" className="text-center font-medium">
                <CustomerServiceOutlined className="mr-1" /> Support
              </Radio.Button>
              <Radio.Button value="manager" className="text-center font-medium">
                <AppstoreOutlined className="mr-1" /> Manager
              </Radio.Button>
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
          <div className="space-y-4 py-2 text-xs">
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

              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Account Status</div>
                <Tag color={viewingUser.isActive !== false ? 'success' : 'default'} className="mt-1 font-bold text-xs">
                  {viewingUser.isActive !== false ? 'Active' : 'Inactive'}
                </Tag>
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
    </div>
  );
};

export default CustomerManagement;
