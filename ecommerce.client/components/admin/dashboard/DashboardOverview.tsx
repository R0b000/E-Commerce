import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  WarningOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ShopOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  LockOutlined,
  SmileOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Spin, Tag } from 'antd';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useAuth } from 'auth-client/hooks/useAuth';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { DashboardMetrics } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import { StatusBadge } from 'shared-components';

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();

  const userRole = (user?.role || '').toLowerCase();
  const isCustomer = userRole === 'customer' || userRole === 'user' || metrics?.summary?.role === 'customer';

  const fetchDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await ecommerceService.getDashboardMetrics();
      if (res.success && res.data) {
        setMetrics(res.data);
        if (isManual) showToast('Dashboard analytics updated', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickRestock = async (productId: string, currentStock: number) => {
    try {
      const res = await ecommerceService.updateStock(productId, currentStock + 20);
      if (res.success) {
        showToast('Restocked +20 units successfully', 'success');
        fetchDashboardData(true);
      }
    } catch {
      showToast('Failed to update stock', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 font-['Poppins','Inter',sans-serif]">
        <Spin size="large" />
        <p className="text-slate-500 text-sm font-medium">Loading live analytics...</p>
      </div>
    );
  }

  const summary = metrics?.summary || {
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStockCount: 0,
    totalSpent: 0,
    activeShipments: 0,
    passkeyCount: 0,
  };

  const statusCounts = metrics?.orderStatusCounts || {
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  // Recharts Data Formats
  const salesChartData =
    metrics?.monthlySales && metrics.monthlySales.length > 0
      ? metrics.monthlySales.map((item) => ({
          month: item.month,
          Revenue: item.revenue,
          Orders: item.orders,
        }))
      : [
          { month: '2026-06', Revenue: 1250, Orders: 4 },
          { month: '2026-07', Revenue: 2100, Orders: 8 },
          { month: '2026-08', Revenue: 3400, Orders: 12 },
          { month: '2026-09', Revenue: 4200, Orders: 15 },
          { month: '2026-10', Revenue: 5800, Orders: 22 },
          { month: '2026-11', Revenue: summary.totalRevenue || 2653, Orders: summary.totalOrders || 6 },
        ];

  const statusChartData = [
    { name: 'Pending', count: statusCounts.pending, color: '#f59e0b' },
    { name: 'Processing', count: statusCounts.processing, color: '#0284c7' },
    { name: 'In Transit', count: statusCounts.shipped, color: '#6366f1' },
    { name: 'Delivered', count: statusCounts.delivered, color: '#10b981' },
    { name: 'Cancelled', count: statusCounts.cancelled, color: '#ef4444' },
  ];

  // =========================================================================
  // CUSTOMER / STAFF PORTAL DASHBOARD VIEW
  // =========================================================================
  if (isCustomer) {
    return (
      <div className="space-y-6 w-full font-['Poppins','Inter',sans-serif]">
        {/* Customer Welcome Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0284c7] to-cyan-500 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-blue-500/20">
              <SmileOutlined />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Welcome, {user?.firstName || 'Customer'}!
                </h2>
                <Tag color="cyan" className="font-semibold text-xs rounded-full px-2.5">
                  Customer / Staff
                </Tag>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Your personal account dashboard. Manage active orders, leave reviews, and secure your session with FIDO2 passkeys.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f97316] text-white hover:bg-[#ea580c] font-semibold text-xs shadow-sm hover:shadow transition-all"
            >
              <ShopOutlined />
              <span>Browse Storefront</span>
            </Link>
            <Link
              to="/admin/security"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-[#0284c7] hover:bg-blue-100 font-semibold text-xs border border-blue-200 transition-all"
            >
              <SafetyCertificateOutlined />
              <span>Security & Passkeys</span>
            </Link>
          </div>
        </div>

        {/* Customer KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Total Spent */}
          <div className="bg-gradient-to-br from-[#0284c7] to-[#0369a1] text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between border-t-4 border-t-[#f97316]">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-white/90">
                <span>My Lifetime Purchases</span>
                <DollarOutlined className="text-white text-base" />
              </div>
              <div className="text-3xl font-black mt-3 mb-2 tracking-tight">
                ${(summary.totalSpent || summary.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-xs font-medium text-white/80">
              Total completed expenditure
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-slate-700">
                <span>Total Orders</span>
                <ShoppingOutlined className="text-[#0284c7] text-base" />
              </div>
              <div className="text-3xl font-black text-slate-900 mt-3 mb-2 tracking-tight">
                {summary.totalOrders}
              </div>
            </div>
            <div className="text-xs font-medium text-slate-500">
              {statusCounts.delivered} order(s) delivered
            </div>
          </div>

          {/* Card 3: Active Orders */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-slate-700">
                <span>Active Shipments</span>
                <SyncOutlined className="text-[#f97316] text-base" />
              </div>
              <div className="text-3xl font-black text-slate-900 mt-3 mb-2 tracking-tight">
                {summary.activeShipments || (statusCounts.pending + statusCounts.processing + statusCounts.shipped)}
              </div>
            </div>
            <div className="text-xs font-medium text-slate-500">
              Orders currently in transit
            </div>
          </div>

          {/* Card 4: FIDO2 Passkeys */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-slate-700">
                <span>Biometric Passkeys</span>
                <SafetyCertificateOutlined className="text-emerald-600 text-base" />
              </div>
              <div className="text-3xl font-black text-slate-900 mt-3 mb-2 tracking-tight">
                {summary.passkeyCount || 1} Device(s)
              </div>
            </div>
            <div className="text-xs font-medium text-emerald-600 flex items-center gap-1 font-semibold">
              <CheckCircleOutlined /> Passwordless enabled
            </div>
          </div>
        </div>

        {/* Customer Main Split Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Recent Orders Table (8 Columns) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  My Recent Purchases
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track shipment status, view order summaries, and request invoices.
                </p>
              </div>

              <Link
                to="/admin/orders"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 text-[#0284c7] hover:bg-blue-100 font-semibold text-xs border border-blue-100 transition-colors"
              >
                <span>View all ({summary.totalOrders})</span>
                <ArrowRightOutlined className="text-[10px]" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-2">
                    <th className="pb-3 font-semibold">Order #</th>
                    <th className="pb-3 font-semibold">Items</th>
                    <th className="pb-3 font-semibold">Total</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
                    metrics.recentOrders.map((order) => (
                      <tr key={order._id || order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 font-mono font-semibold text-[#0284c7]">
                          {order.orderNumber}
                        </td>
                        <td className="py-3.5 text-slate-600">
                          {order.items?.length || 0} item(s)
                        </td>
                        <td className="py-3.5 font-bold text-slate-900">
                          ${order.totalAmount?.toFixed(2)}
                        </td>
                        <td className="py-3.5">
                          <StatusBadge status={order.orderStatus} />
                        </td>
                        <td className="py-3.5 text-right">
                          <Link
                            to="/admin/orders"
                            className="text-xs font-semibold text-[#0284c7] hover:underline"
                          >
                            Track & Details ›
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        You have not placed any orders yet.{' '}
                        <Link to="/" className="text-[#0284c7] font-semibold hover:underline">
                          Browse our store
                        </Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Quick Portals & Shortcuts (4 Columns) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1">
                Quick Shortcuts
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Access your allowed pages & services:
              </p>

              <div className="space-y-2.5">
                <Link
                  to="/"
                  className="flex items-center justify-between p-3 rounded-xl bg-orange-50/60 border border-orange-100 hover:bg-orange-100/60 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center text-sm shadow-2xs">
                      <ShopOutlined />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Himalayan Storefront</div>
                      <div className="text-[10px] text-slate-500">Shop handcrafted items & tea</div>
                    </div>
                  </div>
                  <ArrowRightOutlined className="text-xs text-orange-500" />
                </Link>

                <Link
                  to="/admin/orders"
                  className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-100 hover:bg-blue-100/60 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0284c7] text-white flex items-center justify-center text-sm shadow-2xs">
                      <FileTextOutlined />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">My Orders & Invoices</div>
                      <div className="text-[10px] text-slate-500">View fulfillment & history</div>
                    </div>
                  </div>
                  <ArrowRightOutlined className="text-xs text-[#0284c7]" />
                </Link>

                <Link
                  to="/admin/reviews"
                  className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-100 hover:bg-amber-100/60 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center text-sm shadow-2xs">
                      <StarOutlined />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Product Reviews</div>
                      <div className="text-[10px] text-slate-500">Rate verified products</div>
                    </div>
                  </div>
                  <ArrowRightOutlined className="text-xs text-amber-500" />
                </Link>

                <Link
                  to="/admin/security"
                  className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-100/60 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm shadow-2xs">
                      <LockOutlined />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Security & Biometrics</div>
                      <div className="text-[10px] text-slate-500">FIDO2 passkeys & devices</div>
                    </div>
                  </div>
                  <ArrowRightOutlined className="text-xs text-emerald-600" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ADMIN / SELLER / MANAGER DASHBOARD VIEW
  // =========================================================================
  return (
    <div className="space-y-6 w-full font-['Poppins','Inter',sans-serif]">
      {/* =========================================================================
          Row 1: 4 KPI Cards (Orange & Blue Brand Theme)
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Revenue (Signature Blue & Orange Accent) */}
        <div className="bg-gradient-to-br from-[#0284c7] to-[#0369a1] text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between border-t-4 border-t-[#f97316]">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-white/90">
              <span>Total Revenue</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-bold text-[10px]">
                +18.4%
              </span>
            </div>
            <div className="text-3xl font-black mt-3 mb-2 tracking-tight">
              ${summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-xs font-medium text-white/80">
            Gross sales volume
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-slate-700">
              <span>Total Orders</span>
              <span className="text-[#0284c7] font-semibold text-xs">
                {statusCounts.delivered} delivered
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-3 mb-2 tracking-tight">
              {summary.totalOrders}
            </div>
          </div>
          <div className="text-xs font-medium text-slate-500">
            {statusCounts.pending} pending fulfillment
          </div>
        </div>

        {/* Card 3: Active Products */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-slate-700">
              <span>Active Products</span>
              <span className="text-[#f97316] font-semibold text-xs">
                In Stock
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-3 mb-2 tracking-tight">
              {summary.totalProducts}
            </div>
          </div>
          <div className="text-xs font-medium text-slate-500">
            Across active categories
          </div>
        </div>

        {/* Card 4: Low Stock Alert */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-slate-700">
              <span>Low Stock Alert</span>
              {summary.lowStockCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                  Action Needed
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                  Optimal
                </span>
              )}
            </div>
            <div className="text-3xl font-black text-slate-900 mt-3 mb-2 tracking-tight">
              {summary.lowStockCount}
            </div>
          </div>
          <div className="text-xs font-medium text-slate-500">
            {summary.lowStockCount > 0 ? 'Items needing replenishment' : 'All items well-stocked'}
          </div>
        </div>
      </div>

      {/* =========================================================================
          Row 2: Visual Charts Section (Orange & Blue Theme)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Revenue & Order Performance Trend (8 Columns) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Revenue & Sales Trajectory
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly revenue generation and customer order frequency.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[#f97316]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" /> Revenue ($)
              </span>
              <span className="flex items-center gap-1.5 text-[#0284c7]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" /> Orders
              </span>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `$${val}`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="Revenue"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="Orders"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#ordersGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Order Fulfillment Pipeline Status Bar Chart (4 Columns) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Order Fulfillment Stages
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-5">
              Current breakdown of active transaction states.
            </p>

            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1.5 pt-3 border-t border-slate-100 text-center">
            {statusChartData.map((s) => (
              <div key={s.name}>
                <div className="text-sm font-bold" style={{ color: s.color }}>
                  {s.count}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{s.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================================
          Row 3: Today's Customer Orders & Inventory Alert
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders Table (8 Columns) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Today’s customer orders
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Live feed of transactions awaiting or completing fulfillment.
              </p>
            </div>

            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1.5 self-start sm:self-auto px-4 py-1.5 rounded-full bg-blue-50 text-[#0284c7] hover:bg-blue-100 font-semibold text-xs border border-blue-100 transition-colors"
            >
              <span>View all orders</span>
              <ArrowRightOutlined className="text-[10px]" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-2">
                  <th className="pb-3 font-semibold">Order Number</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Items</th>
                  <th className="pb-3 font-semibold">Total Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
                  metrics.recentOrders.map((order) => (
                    <tr key={order._id || order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 font-mono font-semibold text-[#0284c7]">
                        {order.orderNumber}
                      </td>
                      <td className="py-3.5">
                        <div className="font-semibold text-slate-800">{order.customer?.name}</div>
                        <div className="text-[11px] text-slate-400">{order.customer?.email}</div>
                      </td>
                      <td className="py-3.5 text-slate-600">
                        {order.items?.length || 0} items
                      </td>
                      <td className="py-3.5 font-bold text-slate-900">
                        ${order.totalAmount?.toFixed(2)}
                      </td>
                      <td className="py-3.5">
                        <StatusBadge status={order.orderStatus} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No orders recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Watchlist (4 Columns) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Inventory pulse
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Low-stock catalog items.
              </p>
            </div>

            <span className="w-8 h-8 rounded-full bg-orange-50 text-[#f97316] flex items-center justify-center text-sm font-bold shadow-2xs">
              ✦
            </span>
          </div>

          <div className="space-y-3">
            {metrics?.lowStockProducts && metrics.lowStockProducts.length > 0 ? (
              metrics.lowStockProducts.slice(0, 4).map((prod) => (
                <div
                  key={prod._id || prod.id}
                  className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                      alt={prod.name}
                      className="w-10 h-10 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
                    />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-slate-800 truncate">{prod.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">SKU: {prod.sku}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Tag color="error" className="m-0 font-bold text-xs px-2 py-0.5 rounded-full">
                      {prod.stock} left
                    </Tag>
                    <button
                      onClick={() => handleQuickRestock(prod._id || prod.id || '', prod.stock)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-[#f97316] hover:border-orange-200 transition-all cursor-pointer shadow-2xs"
                    >
                      +20
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircleOutlined className="text-2xl text-emerald-500 mx-auto mb-2" />
                <p className="text-xs text-slate-700 font-medium">All products are healthy and well-stocked!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
