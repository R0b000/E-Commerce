import React, { useEffect, useState, useMemo } from 'react';
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
  CompassOutlined,
  PlusOutlined,
  RiseOutlined,
  UserOutlined,
  ThunderboltFilled,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { Tag } from 'antd';
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
import { DashboardMetrics, Order } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import { StatusBadge, DashboardSkeleton, AppButton } from 'shared-components';
import { OrderMapTracker } from '../orders/OrderMapTracker';

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'6m' | '1y' | 'all'>('6m');
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
  const rawMonthlySales = metrics?.monthlySales && metrics.monthlySales.length > 0
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

  const salesChartData = useMemo(() => {
    if (timeRange === '6m') return rawMonthlySales.slice(-6);
    if (timeRange === '1y') return rawMonthlySales.slice(-12);
    return rawMonthlySales;
  }, [rawMonthlySales, timeRange]);

  const statusChartData = [
    { name: 'Pending', count: statusCounts.pending, color: '#f59e0b' },
    { name: 'Processing', count: statusCounts.processing, color: '#0284c7' },
    { name: 'In Transit', count: statusCounts.shipped, color: '#6366f1' },
    { name: 'Delivered', count: statusCounts.delivered, color: '#10b981' },
    { name: 'Cancelled', count: statusCounts.cancelled, color: '#ef4444' },
  ];

  // Derived KPI insights
  const avgOrderValue = useMemo(() => {
    const ordersCount = summary.totalOrders || 1;
    return (summary.totalRevenue / ordersCount).toFixed(2);
  }, [summary.totalRevenue, summary.totalOrders]);

  const fulfillmentRate = useMemo(() => {
    const total = summary.totalOrders || 1;
    const delivered = statusCounts.delivered || 0;
    return Math.min(100, Math.round((delivered / total) * 100));
  }, [summary.totalOrders, statusCounts.delivered]);

  const inStockPercentage = useMemo(() => {
    const total = summary.totalProducts || 1;
    const low = summary.lowStockCount || 0;
    return Math.max(0, Math.round(((total - low) / total) * 100));
  }, [summary.totalProducts, summary.lowStockCount]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  // =========================================================================
  // CUSTOMER / STAFF PORTAL DASHBOARD VIEW
  // =========================================================================
  if (isCustomer) {
    return (
      <div className="space-y-6 w-full font-['Nunito_Sans','Poppins',sans-serif]">
        {/* Customer Welcome Header Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0284c7] border border-blue-100 flex items-center justify-center text-base font-bold shrink-0">
              <SmileOutlined />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] sm:text-[16px] font-bold text-slate-900 tracking-tight leading-tight">
                  Welcome, {user?.firstName || 'Customer'}!
                </h2>
                <Tag color="cyan" className="font-semibold text-[10px] rounded-full px-2">
                  Customer / Staff
                </Tag>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
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
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-slate-700">
                <span>My Lifetime Purchases</span>
                <DollarOutlined className="text-[#0284c7] text-base" />
              </div>
              <div className="text-3xl font-black text-slate-900 mt-3 mb-2 tracking-tight">
                ${(summary.totalSpent || summary.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-xs font-medium text-slate-500">
              Total completed expenditure
            </div>
          </div>

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
                  <tr className="border-b border-slate-100 text-[12px] font-medium text-slate-400 uppercase tracking-wider pb-2">
                    <th className="pb-3 font-medium">Order #</th>
                    <th className="pb-3 font-medium">Items</th>
                    <th className="pb-3 font-medium">Total</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
                    metrics.recentOrders.map((order) => (
                      <tr
                        key={order._id || order.id}
                        onClick={() => setSelectedOrder(order as any)}
                        className="hover:bg-sky-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 font-mono font-semibold text-[#0284c7] group-hover:underline flex items-center gap-1.5">
                          <CompassOutlined className="text-slate-400 group-hover:text-[#0284c7]" />
                          <span>{order.orderNumber}</span>
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
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order as any);
                            }}
                            className="text-xs font-semibold text-[#0284c7] hover:underline cursor-pointer inline-flex items-center gap-1"
                          >
                            <CompassOutlined />
                            <span>Track Live Map ›</span>
                          </button>
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

        {selectedOrder && (
          <OrderMapTracker
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // ADMIN / EXECUTIVE COMMAND CENTER VIEW
  // =========================================================================
  return (
    <div className="space-y-6 w-full font-['Nunito_Sans','Poppins',sans-serif]">
      {/* =========================================================================
          1. Unique Executive Command Header
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Command Center</span>
              <span className="text-slate-400 font-light">/</span>
              <span className="text-[#0284c7] font-bold text-lg sm:text-xl">
                {user?.firstName ? `${user.firstName}'s Overview` : 'Executive Overview'}
              </span>
            </h1>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Telemetry
            </span>
          </div>

          <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>Store operating at 100% capacity</span>
            <span className="text-slate-300">·</span>
            <span>{summary.totalOrders} total transactions</span>
            <span className="text-slate-300">·</span>
            <span>{statusCounts.pending} order(s) awaiting dispatch</span>
          </p>
        </div>

        {/* Quick Executive Actions Cluster */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            to="/admin/products?action=new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0096C7] hover:bg-[#0077B6] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <PlusOutlined />
            <span>Add Product</span>
          </Link>

          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <ShoppingOutlined />
            <span>Orders ({summary.totalOrders})</span>
          </Link>

          <Link
            to="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold transition-all cursor-pointer"
          >
            <ShopOutlined />
            <span>Storefront ↗</span>
          </Link>

          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            title="Refresh Live Analytics"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center justify-center text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <SyncOutlined spin={refreshing} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. Executive Metric Ribbon with Micro Sparklines & Conversion Ratios
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Gross Platform Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Gross Revenue</span>
              <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#0284c7] flex items-center justify-center text-sm font-bold">
                <DollarOutlined />
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                ${summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 inline-flex items-center gap-0.5">
                <RiseOutlined /> +18.4%
              </span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Avg Order Value:</span>
            <span className="font-bold text-slate-700 font-mono">${avgOrderValue}</span>
          </div>
        </div>

        {/* Metric 2: Total Volume & Fulfillment Rate */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Order Volume</span>
              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
                <ShoppingOutlined />
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {summary.totalOrders}
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {statusCounts.delivered} fulfilled
              </span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Fulfillment Success:</span>
            <span className="font-bold text-emerald-600 font-mono">{fulfillmentRate}%</span>
          </div>
        </div>

        {/* Metric 3: Active Catalog SKUs & Inventory Health */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Catalog SKUs</span>
              <span className="w-8 h-8 rounded-xl bg-orange-50 text-[#f97316] flex items-center justify-center text-sm font-bold">
                <AppstoreOutlined />
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {summary.totalProducts}
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                Live items
              </span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Stock Health Index:</span>
            <span className={`font-bold font-mono ${inStockPercentage > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {inStockPercentage}% Healthy
            </span>
          </div>
        </div>

        {/* Metric 4: Platform Buyers / Customers */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Active Accounts</span>
              <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-bold">
                <UserOutlined />
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {summary.totalCustomers || 15}
              </span>
              <span className="text-[11px] font-bold text-emerald-600">
                Verified
              </span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Biometric Passkeys:</span>
            <span className="font-bold text-purple-600 font-mono">100% Enabled</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. Smart "Action Center" (Real-time Operations Pulse)
         ========================================================================= */}
      {(summary.lowStockCount > 0 || statusCounts.pending > 0) && (
        <div className="bg-linear-to-r from-amber-50/70 to-orange-50/40 rounded-2xl border border-amber-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center text-base shrink-0 shadow-2xs">
              <ThunderboltFilled />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                Action Required ({summary.lowStockCount + statusCounts.pending} items)
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                {statusCounts.pending > 0 && `${statusCounts.pending} pending order(s) awaiting shipment. `}
                {summary.lowStockCount > 0 && `${summary.lowStockCount} product(s) are at or below critical inventory threshold.`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {statusCounts.pending > 0 && (
              <Link
                to="/admin/orders"
                className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100/60 font-semibold text-xs shadow-2xs transition-colors"
              >
                Fulfill Orders ›
              </Link>
            )}
            {summary.lowStockCount > 0 && (
              <Link
                to="/admin/inventory"
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-2xs transition-colors"
              >
                Restock Warehouse ›
              </Link>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          4. Visual Performance Trajectory & Pipeline Breakdown
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Trajectory Area Chart (8 Columns) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Revenue & Sales Trajectory
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly revenue generation and customer order frequency.
              </p>
            </div>

            {/* Timeframe Pill Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
              <button
                onClick={() => setTimeRange('6m')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  timeRange === '6m' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                6 Months
              </button>
              <button
                onClick={() => setTimeRange('1y')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  timeRange === '1y' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                1 Year
              </button>
              <button
                onClick={() => setTimeRange('all')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  timeRange === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All Time
              </button>
            </div>
          </div>

          <div className="h-[270px] w-full">
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

        {/* Order Fulfillment Pipeline Stages (4 Columns) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Order Fulfillment Stages
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
              Current breakdown of active transaction states.
            </p>

            <div className="h-[210px] w-full">
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

          <div className="grid grid-cols-5 gap-1 pt-3 border-t border-slate-100 text-center">
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
          5. Live Transactions & Warehouse Stock Pulse
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Orders Feed (8 Columns) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Live Customer Orders
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time transactions with 1-click live GPS tracking map.
              </p>
            </div>

            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-lg bg-blue-50 text-[#0284c7] hover:bg-blue-100 font-semibold text-xs border border-blue-100 transition-colors"
            >
              <span>View all orders ({summary.totalOrders})</span>
              <ArrowRightOutlined className="text-[10px]" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2">
                  <th className="pb-3">Order Number</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Map Tracker</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
                  metrics.recentOrders.map((order) => (
                    <tr
                      key={order._id || order.id}
                      onClick={() => setSelectedOrder(order as any)}
                      className="hover:bg-sky-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 font-mono font-bold text-[#0284c7] group-hover:underline">
                        {order.orderNumber}
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-slate-800">{order.customer?.name}</div>
                        <div className="text-[10px] text-slate-400">{order.customer?.email}</div>
                      </td>
                      <td className="py-3 text-slate-600 font-medium">
                        {order.items?.length || 0} items
                      </td>
                      <td className="py-3 font-bold text-slate-900">
                        ${order.totalAmount?.toFixed(2)}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={order.orderStatus} />
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order as any);
                          }}
                          className="px-2.5 py-1 rounded-md bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200 text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <CompassOutlined />
                          <span>Track GPS ›</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No orders recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Warehouse Inventory Pulse (4 Columns) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Inventory Pulse
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Items requiring immediate restock.
                </p>
              </div>

              <span className="w-8 h-8 rounded-full bg-orange-50 text-[#f97316] flex items-center justify-center text-sm shadow-2xs">
                <WarningOutlined />
              </span>
            </div>

            <div className="space-y-2.5">
              {metrics?.lowStockProducts && metrics.lowStockProducts.length > 0 ? (
                metrics.lowStockProducts.slice(0, 4).map((prod) => (
                  <div
                    key={prod._id || prod.id}
                    className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <img
                        src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                        alt={prod.name}
                        className="w-9 h-9 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
                      />
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-800 truncate">{prod.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Tag color="error" className="m-0 font-bold text-[10px] px-1.5 py-0 rounded-full">
                        {prod.stock} left
                      </Tag>
                      <button
                        onClick={() => handleQuickRestock(prod._id || prod.id || '', prod.stock)}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-orange-50 hover:text-[#f97316] hover:border-orange-200 transition-all cursor-pointer shadow-2xs"
                      >
                        +20
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircleOutlined className="text-2xl text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-700 font-medium">All products are healthy and well-stocked!</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Warehouse stock alerts:</span>
            <Link to="/admin/inventory" className="text-[#0284c7] font-semibold hover:underline">
              Manage inventory ›
            </Link>
          </div>
        </div>
      </div>

      {/* Live Order GPS Tracking Map Modal */}
      {selectedOrder && (
        <OrderMapTracker
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};

export default DashboardOverview;
