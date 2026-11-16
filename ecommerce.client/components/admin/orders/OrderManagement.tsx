import React, { useEffect, useState } from 'react';
import {
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  SyncOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import { Radio, Popconfirm, Spin, Tag } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { Order } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from 'auth-client/hooks/useAuth';
import {
  AppCard,
  AppButton,
  AppInput,
  AppSelect,
  AppModal,
  PageHeader,
  StatusBadge,
} from 'shared-components';
import { OrderMapTracker } from './OrderMapTracker';

export const OrderManagement: React.FC = () => {
  const { user } = useAuth();
  const isSeller = user?.role === 'seller';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={isSeller ? 'My Store Orders & Fulfillment' : 'Customer Orders & Fulfillment'}
        description={
          isSeller
            ? 'Review customer orders containing your products, update tracking numbers, and manage dispatch.'
            : 'Review platform-wide customer transactions, update tracking numbers, and manage dispatch.'
        }
        breadcrumbs={[{ label: isSeller ? 'Seller' : 'Admin', path: '/admin' }, { label: 'Orders' }]}
        extra={
          <AppButton icon={<SyncOutlined />} onClick={loadOrders}>
            Refresh Orders
          </AppButton>
        }
      />

      {/* Filter Tabs and Search */}
      <AppCard>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Radio.Group
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            buttonStyle="solid"
            size="middle"
          >
            <Radio.Button value="all">All Orders</Radio.Button>
            <Radio.Button value="pending">Pending</Radio.Button>
            <Radio.Button value="processing">Processing</Radio.Button>
            <Radio.Button value="shipped">In Transit</Radio.Button>
            <Radio.Button value="delivered">Delivered</Radio.Button>
            <Radio.Button value="cancelled">Cancelled</Radio.Button>
          </Radio.Group>

          <form onSubmit={handleSearch} className="w-full md:w-80">
            <AppInput
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order # or email..."
              allowClear
            />
          </form>
        </div>
      </AppCard>

      {/* Orders Table Card */}
      <AppCard bodyStyle={{ padding: 0 }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[12px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/70">
                <th className="py-3.5 px-6">Order ID</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">{isSeller ? 'Your Earnings' : 'Total Amount'}</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Order Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                    <Spin />
                    <p className="mt-2 text-xs">Fetching orders...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    No orders match the selected filter.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
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
                        <Tag
                          color={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                          className="font-medium text-xs px-2 py-0.5 rounded capitalize"
                        >
                          {order.paymentStatus}
                        </Tag>
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
                          >
                            Track & Map
                          </AppButton>
                          {!isSeller && (
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
          </table>
        </div>
      </AppCard>

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
