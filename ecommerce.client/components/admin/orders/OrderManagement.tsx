import React, { useEffect, useState } from 'react';
import {
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  SyncOutlined,
  UserOutlined,
  EnvironmentOutlined,
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
                    <tr key={orderId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-[#0096C7]">
                        {order.orderNumber}
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
                        <div className="flex items-center justify-end gap-2">
                          <AppButton
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => openOrderDetail(order)}
                          >
                            Details
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <AppModal
          open={!!selectedOrder}
          title={`Order #${selectedOrder.orderNumber}`}
          onCancel={() => setSelectedOrder(null)}
          footer={null}
          width={680}
        >
          <div className="space-y-6 pt-2">
            {/* Fulfillment controls inside clean box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Update Dispatch Status
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <AppSelect
                  label="Order Status"
                  value={newStatus}
                  onChange={(val) => setNewStatus(val as string)}
                  options={[
                    { label: 'Pending', value: 'pending' },
                    { label: 'Processing', value: 'processing' },
                    { label: 'In Transit', value: 'shipped' },
                    { label: 'Delivered', value: 'delivered' },
                    { label: 'Cancelled', value: 'cancelled' },
                  ]}
                />

                <AppSelect
                  label="Payment Status"
                  value={newPaymentStatus}
                  onChange={(val) => setNewPaymentStatus(val as string)}
                  options={[
                    { label: 'Pending', value: 'pending' },
                    { label: 'Paid', value: 'paid' },
                    { label: 'Refunded', value: 'refunded' },
                  ]}
                />

                <AppInput
                  label="Tracking Number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="TRK-US-..."
                />
              </div>

              <div className="flex justify-end pt-2">
                <AppButton
                  type="primary"
                  loading={updatingStatus}
                  onClick={handleUpdateOrderStatus}
                  style={{ backgroundColor: '#0096C7' }}
                >
                  Save Status
                </AppButton>
              </div>
            </div>

            {/* Customer & Shipping */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 uppercase tracking-wider mb-2">
                  <UserOutlined className="text-[#0096C7]" />
                  <span>Customer Contact</span>
                </div>
                <div className="font-bold text-slate-900 text-sm">{selectedOrder.customer?.name}</div>
                <div className="text-slate-500">{selectedOrder.customer?.email}</div>
                {selectedOrder.customer?.phone && <div className="text-slate-500 mt-0.5">{selectedOrder.customer?.phone}</div>}
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 uppercase tracking-wider mb-2">
                  <EnvironmentOutlined className="text-emerald-600" />
                  <span>Destination Address</span>
                </div>
                <div className="text-slate-800">
                  <div>{selectedOrder.shippingAddress?.street}</div>
                  <div>
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode}
                  </div>
                  <div>{selectedOrder.shippingAddress?.country}</div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Purchased Items ({selectedOrder.items?.length || 0})
              </div>
              <div className="divide-y divide-slate-100 rounded-xl bg-white border border-slate-200 overflow-hidden">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-md object-cover border border-slate-200" />
                      )}
                      <div>
                        <div className="text-xs font-semibold text-slate-800">{item.name}</div>
                        <div className="text-[11px] text-slate-400">Qty: {item.quantity} × ${item.price?.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="font-bold text-xs text-slate-900">${(item.quantity * item.price)?.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financials */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${selectedOrder.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Sales Tax</span>
                <span>${selectedOrder.taxAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>{selectedOrder.shippingAmount === 0 ? 'FREE' : `$${selectedOrder.shippingAmount?.toFixed(2)}`}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Amount</span>
                <span className="text-[#0096C7]">${selectedOrder.totalAmount?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </AppModal>
      )}
    </div>
  );
};

export default OrderManagement;
