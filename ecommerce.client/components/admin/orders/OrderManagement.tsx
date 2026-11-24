import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  SyncOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CompassOutlined,
  LeftOutlined,
  RightOutlined,
  DownOutlined,
  ShoppingOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { Popconfirm, Spin, Tag, Breadcrumb, Dropdown } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { Order } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from 'auth-client/hooks/useAuth';
import { usePermissions } from '../../../context/PermissionContext';
import {
  AppTable,
  AppButton,
  AppInput,
  AppSelect,
  StatusBadge,
  TableSkeleton,
} from 'shared-components';
import { OrderMapTracker } from './OrderMapTracker';

export const OrderManagement: React.FC = () => {
  const { user } = useAuth();
  const isSeller = user?.role === 'seller';
  const { can } = usePermissions();

  const canEditOrders = can('edit', 'orders');
  const canDeleteOrders = can('delete', 'orders');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  const { showToast } = useToast();

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await ecommerceService.getOrders({
        search: searchQuery,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 100,
      });
      if (res.success && res.data) {
        setOrders(res.data.orders);
      }
    } catch {
      showToast('Error loading orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);
    setNewPaymentStatus(order.paymentStatus);
    setTrackingNumber(order.trackingNumber || '');
  };

  const handleUpdateOrderStatus = async () => {
    if (!canEditOrders) {
      showToast('Permission denied: You do not have permission to update orders', 'error');
      return;
    }
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    const orderId = selectedOrder._id || selectedOrder.id;

    try {
      const res = await ecommerceService.updateOrderStatus(orderId!, {
        orderStatus: newStatus,
        paymentStatus: newPaymentStatus,
        trackingNumber,
      });

      if (res.success) {
        showToast('Order fulfillment status updated', 'success');
        setSelectedOrder((prev) => (prev ? { ...prev, orderStatus: newStatus as any, paymentStatus: newPaymentStatus as any, trackingNumber } : null));
        setOrders((prev) =>
          prev.map((o) =>
            (o._id || o.id) === orderId
              ? { ...o, orderStatus: newStatus as any, paymentStatus: newPaymentStatus as any, trackingNumber }
              : o
          )
        );
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to update order', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateOrderStatusFromMap = async (
    orderId: string,
    orderStatus: string,
    paymentStatusVal: string,
    trackingNumberVal: string
  ) => {
    setUpdatingStatus(true);
    try {
      const res = await ecommerceService.updateOrderStatus(orderId, {
        orderStatus,
        paymentStatus: paymentStatusVal,
        trackingNumber: trackingNumberVal,
      });

      if (res.success) {
        showToast('Order fulfillment status updated', 'success');
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                orderStatus: orderStatus as any,
                paymentStatus: paymentStatusVal as any,
                trackingNumber: trackingNumberVal,
              }
            : null
        );
        setOrders((prev) =>
          prev.map((o) =>
            (o._id || o.id) === orderId
              ? {
                  ...o,
                  orderStatus: orderStatus as any,
                  paymentStatus: paymentStatusVal as any,
                  trackingNumber: trackingNumberVal,
                }
              : o
          )
        );
      } else {
        showToast((res as any).messages?.[0] || 'Failed to update order status', 'error');
      }
    } catch {
      showToast('Failed to update order status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    if (!canDeleteOrders) {
      showToast('Permission denied: You do not have permission to delete orders', 'error');
      return;
    }
    const orderId = order._id || order.id;
    try {
      const res = await ecommerceService.deleteOrder(orderId!);
      if (res.success) {
        showToast('Order removed', 'success');
        setOrders((prev) => prev.filter((o) => (o._id || o.id) !== orderId));
        if (selectedOrder && (selectedOrder._id || selectedOrder.id) === orderId) {
          setSelectedOrder(null);
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to delete order', 'error');
    }
  };

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const paginatedOrders = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Summary Metrics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.orderStatus === 'pending' || o.orderStatus === 'processing').length;
  const inTransitOrders = orders.filter((o) => o.orderStatus === 'shipped').length;
  const deliveredOrders = orders.filter((o) => o.orderStatus === 'delivered').length;
  const totalVolume = orders.reduce(
    (sum, o) => sum + ((isSeller && o.sellerEarnings !== undefined ? o.sellerEarnings : o.totalAmount) || 0),
    0
  );

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden font-['Poppins','Inter',sans-serif] space-y-2.5">
      {/* Top Bar: Breadcrumb */}
      <div className="shrink-0">
        <Breadcrumb
          className="text-[11px] leading-none text-slate-500 [&_*]:border-0 font-semibold"
          items={[
            {
              title: (
                <Link to="/admin" className="text-slate-500 hover:text-[#0096C7] transition-colors font-semibold">
                  {isSeller ? 'Seller' : 'Admin'}
                </Link>
              ),
            },
            {
              title: <span className="text-slate-800 font-bold">Orders</span>,
            },
          ]}
        />
      </div>

      {/* Two-Column Responsive Layout: Left Table Directory + Right Summary & Actions (Independent Scroll) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row items-stretch gap-3 sm:gap-4 overflow-hidden">
        {/* Left Column: Orders Directory Table */}
        <div className="flex-1 min-w-0 h-full bg-white rounded-t-2xl rounded-b-[2px] shadow-xs overflow-hidden flex flex-col">
          {/* Header Toolbar: Title + Search + Status Filter */}
          <div className="pl-0 pr-4 py-3 flex items-center justify-between gap-3 bg-white shrink-0">
            <div className="shrink-0">
              <h3 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
                {isSeller ? 'My Store Orders' : 'Orders'}
              </h3>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {/* Search Input */}
              <div className="w-full sm:w-[220px]">
                <AppInput
                  prefix={<SearchOutlined className="text-slate-400" />}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search orders..."
                  allowClear
                />
              </div>

              {/* Status Filter */}
              <div className="w-[140px] shrink-0">
                <AppSelect
                  value={statusFilter}
                  onChange={(val) => {
                    setStatusFilter(val as string);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: 'All Statuses', value: 'all' },
                    { label: 'Pending', value: 'pending' },
                    { label: 'Processing', value: 'processing' },
                    { label: 'In Transit', value: 'shipped' },
                    { label: 'Delivered', value: 'delivered' },
                    { label: 'Cancelled', value: 'cancelled' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Orders Table Wrapper (Independent Scroll Area) */}
          <div className="flex-1 min-h-0 overflow-y-auto brand-table-scroll">
            <AppTable>
              <thead>
                <tr>
                  <th className="py-2.5 px-6 font-medium text-[12px]">Order ID</th>
                  <th className="py-2.5 px-4 font-medium text-[12px]">Date</th>
                  <th className="py-2.5 px-4 font-medium text-[12px]">Customer</th>
                  <th className="py-2.5 px-4 font-medium text-[12px]">{isSeller ? 'Your Earnings' : 'Total Amount'}</th>
                  <th className="py-2.5 px-4 font-medium text-[12px]">Payment</th>
                  <th className="py-2.5 px-4 font-medium text-[12px]">Order Status</th>
                  <th className="py-2.5 px-6 text-right font-medium text-[12px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <TableSkeleton columns={7} rows={6} hasAvatar={false} />
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                      No orders match the selected filter.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => {
                    const orderId = order._id || order.id;
                    const dateStr = new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <tr
                        key={orderId}
                        onClick={() => openOrderDetail(order)}
                        className="hover:bg-sky-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-6 font-mono text-xs font-semibold text-[#0096C7] group-hover:underline flex items-center gap-1.5">
                          <CompassOutlined className="text-slate-400 group-hover:text-[#0096c7]" />
                          <span>{order.orderNumber}</span>
                        </td>

                        <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {dateStr}
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-semibold text-slate-800 text-xs">{order.customer?.name}</div>
                          <div className="text-[11px] text-slate-400">{order.customer?.email}</div>
                        </td>

                        <td className="py-4 px-4 font-bold text-slate-900 text-sm">
                          ${(isSeller && order.sellerEarnings !== undefined ? order.sellerEarnings : order.totalAmount)?.toFixed(2)}
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <Tag
                              color={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                              className="font-medium text-xs px-2 py-0.5 rounded capitalize m-0"
                            >
                              {order.paymentStatus}
                            </Tag>
                            <span className="text-[10px] font-semibold">
                              {order.paymentMethod === 'khalti' ? (
                                <span className="text-[#5c2d91] font-bold">Khalti Pay</span>
                              ) : order.paymentMethod === 'esewa' ? (
                                <span className="text-[#60bb46] font-bold">eSewa ePay</span>
                              ) : (
                                <span className="text-slate-400 capitalize">{order.paymentMethod?.replace('_', ' ')}</span>
                              )}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <StatusBadge status={order.orderStatus} />
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <AppButton
                              size="small"
                              type="primary"
                              icon={<CompassOutlined />}
                              onClick={() => openOrderDetail(order)}
                              style={{ backgroundColor: '#0096c7' }}
                              title="Track & Map"
                            />
                            {canDeleteOrders && !isSeller && (
                              <Popconfirm
                                title="Delete Order"
                                description={`Delete order ${order.orderNumber}?`}
                                onConfirm={() => handleDeleteOrder(order)}
                                okText="Yes, Delete"
                                cancelText="Cancel"
                                okButtonProps={{ danger: true }}
                              >
                                <AppButton
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
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

          {/* Table Footer: Matching Brand pagination footer */}
          <div className="px-6 h-[30px] min-h-[30px] bg-[#0096C7] text-white rounded-b-[2px] flex items-center justify-between text-[11px] shadow-inner select-none shrink-0">
            {/* Left Side: Order Count */}
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-medium text-white/90 text-[11px] leading-none">Total Orders:</span>
              <span className="font-bold text-white text-[11px] leading-none">
                {orders.length} Items
              </span>
            </div>

            {/* Right Side: Pagination Controls */}
            {orders.length > 0 && (
              <div className="flex items-center gap-2.5 leading-none">
                <div className="flex items-center gap-1.5 text-[10px] text-white/95 font-medium leading-none">
                  <span>Items:</span>
                  <Dropdown
                    menu={{
                      items: [
                        { key: '10', label: <span className="font-semibold text-xs text-slate-800">10 / page</span> },
                        { key: '20', label: <span className="font-semibold text-xs text-slate-800">20 / page</span> },
                        { key: '50', label: <span className="font-semibold text-xs text-slate-800">50 / page</span> },
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
                  {orders.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
                  {Math.min(currentPage * pageSize, orders.length)} of {orders.length}
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

        {/* Right Column: Order Summary Metrics (Independent Scroll Area) */}
        <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 h-full overflow-y-auto brand-sidebar-scroll space-y-3.5 pr-1">
          {/* Card 1: Quick Refresh */}
          <div className="bg-white rounded-2xl shadow-xs px-4 py-3 flex items-center">
            <button
              type="button"
              onClick={loadOrders}
              className="w-full h-[32px] flex items-center justify-center gap-1.5 bg-[#0096C7] hover:bg-[#0083ae] active:bg-[#007096] text-white font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <SyncOutlined className={`text-xs ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Orders</span>
            </button>
          </div>

          {/* Card 2: Order Summary (Static Clean View) */}
          <div className="bg-white rounded-2xl shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h4 className="text-xs font-bold text-slate-900">Order Summary</h4>
              <span className="text-[10px] font-bold text-[#0096C7] bg-sky-50 px-2.5 py-0.5 rounded-full">
                Live Metrics
              </span>
            </div>

            <div className="space-y-1">
              {/* Metric 1: Total Orders */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Total Orders
                  </span>
                  <span className="text-2xl font-black text-slate-900 leading-tight block">
                    {totalOrders}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Lifetime volume
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0096C7] flex items-center justify-center text-lg shrink-0">
                  <ShoppingOutlined />
                </div>
              </div>

              {/* Metric 2: Pending & Processing */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Needs Action
                  </span>
                  <span className="text-2xl font-black text-amber-600 leading-tight block">
                    {pendingOrders}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Pending / Processing
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg shrink-0">
                  <ClockCircleOutlined />
                </div>
              </div>

              {/* Metric 3: Delivered */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Delivered
                  </span>
                  <span className="text-2xl font-black text-emerald-600 leading-tight block">
                    {deliveredOrders}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Successfully fulfilled
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                  <CheckCircleOutlined />
                </div>
              </div>

              {/* Metric 4: Total Volume */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    {isSeller ? 'Your Earnings' : 'Total Revenue'}
                  </span>
                  <span className="text-2xl font-black text-purple-600 leading-tight block">
                    ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Gross order value
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg shrink-0">
                  <DollarOutlined />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Live Map & GPS Dispatch Tracker */}
      {selectedOrder && (
        <OrderMapTracker
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateOrderStatusFromMap}
          updating={updatingStatus}
          isSeller={isSeller}
        />
      )}
    </div>
  );
};

export default OrderManagement;
