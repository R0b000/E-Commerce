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
} from '@ant-design/icons';
import { Radio, Popconfirm, Spin, Tag, Breadcrumb } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { Order } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from 'auth-client/hooks/useAuth';
import { usePermissions } from '../../../context/PermissionContext';
import {
  AppCard,
  AppTable,
  AppButton,
  AppInput,
  AppSelect,
  AppModal,
  PageHeader,
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

  return (
    <div className="w-full font-['Poppins','Inter',sans-serif]">
      {/* Breadcrumb Navigation */}
      <div className="px-2 flex items-center gap-1.5 text-[11px] leading-none text-slate-400 mb-0 pb-0">
        <Breadcrumb
          className="text-[11px] leading-none text-slate-400 [&_*]:border-0"
          items={[
            {
              title: (
                <Link to="/admin" className="text-slate-400 hover:text-[#0096C7] transition-colors">
                  {isSeller ? 'Seller' : 'Admin'}
                </Link>
              ),
            },
            {
              title: <span className="text-slate-600 font-medium">Orders</span>,
            },
          ]}
        />
      </div>

      {/* Main Orders Directory Card with Integrated Header */}
      <div className="bg-white rounded-t-2xl rounded-b-md shadow-xs">
        {/* Table Top Controls & Integrated Header (relative z-20 so dropdown floats cleanly over table) */}
        <div className="px-2 py-3 sm:py-3.5 border-b border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white relative z-20 rounded-t-2xl">
          <div className="flex flex-col min-w-0">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {isSeller ? 'My Store Orders & Fulfillment' : 'Customer Orders & Fulfillment'}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <Radio.Group
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="all">All</Radio.Button>
              <Radio.Button value="pending">Pending</Radio.Button>
              <Radio.Button value="processing">Processing</Radio.Button>
              <Radio.Button value="shipped">In Transit</Radio.Button>
              <Radio.Button value="delivered">Delivered</Radio.Button>
              <Radio.Button value="cancelled">Cancelled</Radio.Button>
            </Radio.Group>

            {/* Search Input */}
            <form onSubmit={handleSearch} className="w-full sm:w-[240px] shrink-0">
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
            </form>
          </div>
        </div>

        {/* Orders Table Wrapper */}
        <div className="overflow-hidden">
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

        {/* Table Footer: Count on Left, Pagination on Right (Matching Header Height ~30px & Subtle Roundness rounded-b-md) */}
        <div className="px-6 h-[30px] min-h-[30px] bg-[#0096C7] text-white rounded-b-md flex items-center justify-between text-[11px] shadow-inner select-none">
          {/* Left Side: Order Count */}
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-medium text-white/90 text-[11px] leading-none">Total Orders:</span>
            <span className="font-bold text-white text-[11px] leading-none">
              {orders.length} Items
            </span>
          </div>

          {/* Right Side: Pagination Controls (Rendered ONLY if orders > 10) */}
          {orders.length > 10 && (
            <div className="flex items-center gap-2.5 leading-none">
              <div className="flex items-center gap-1 text-[10px] text-white/95 font-medium leading-none">
                <span>Rows:</span>
                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="appearance-none bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-[10px] rounded pl-1.5 pr-4 py-0 outline-none cursor-pointer transition-colors focus:ring-1 focus:ring-white h-[20px] leading-none"
                  >
                    <option value={10} className="bg-slate-800 text-white">10</option>
                    <option value={20} className="bg-slate-800 text-white">20</option>
                    <option value={50} className="bg-slate-800 text-white">50</option>
                    <option value={100} className="bg-slate-800 text-white">100</option>
                  </select>
                  <DownOutlined className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[7px] text-white/80" />
                </div>
              </div>

              <span className="text-[10px] text-white/95 font-medium whitespace-nowrap leading-none">
                {orders.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, orders.length)} of {orders.length}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="Previous page"
                  className="w-5 h-5 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 active:bg-white/30 disabled:opacity-30 disabled:hover:bg-white/15 disabled:cursor-not-allowed text-white transition-all cursor-pointer border border-white/20"
                >
                  <LeftOutlined className="text-[8px]" />
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Next page"
                  className="w-5 h-5 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 active:bg-white/30 disabled:opacity-30 disabled:hover:bg-white/15 disabled:cursor-not-allowed text-white transition-all cursor-pointer border border-white/20"
                >
                  <RightOutlined className="text-[8px]" />
                </button>
              </div>
            </div>
          )}
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
