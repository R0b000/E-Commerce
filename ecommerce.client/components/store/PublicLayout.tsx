import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import {
  ShoppingOutlined,
  SafetyOutlined,
  AppstoreOutlined,
  UserOutlined,
  LogoutOutlined,
  CarOutlined,
  CustomerServiceOutlined,
  RollbackOutlined,
  FileTextOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { Badge, Avatar, Modal, Tag, Spin } from 'antd';
import { useCart } from '../../context/CartContext';
import { CartDrawer } from './CartDrawer';
import { useAuth } from 'auth-client/hooks/useAuth';
import { AppButton, StatusBadge } from 'shared-components';
import { ecommerceService } from '../../services/EcommerceAPIService';
import { Order } from '../../types/ecommerce.types';

export const PublicLayout: React.FC = () => {
  const { cartCount, setIsCartOpen } = useCart();
  const { user, isAuthenticated, logout, formattedExpiry } = useAuth();
  const navigate = useNavigate();

  const userRole = (user?.role || '').toLowerCase();
  const isSeller = userRole === 'seller';
  const isAdmin = userRole === 'admin';
  const isCustomer = userRole === 'customer' || userRole === 'user';

  // Customer Orders Modal
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const openMyOrders = async () => {
    setIsOrdersModalOpen(true);
    setLoadingOrders(true);
    try {
      const res = await ecommerceService.getOrders({ limit: 50 });
      if (res.success && res.data) {
        setCustomerOrders(res.data.orders);
      }
    } catch {
      // Failed to load
    } finally {
      setLoadingOrders(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col antialiased">
      {/* Top Banner Notice */}
      <div className="bg-[#0096C7] text-white text-xs font-semibold py-2 px-4 text-center tracking-wide flex items-center justify-center gap-2">
        <ThunderboltFilled className="text-amber-300 text-xs" />
        <span>Himalaya Online Shop: Free Nationwide Delivery on orders over $150</span>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="w-full px-4 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <img
              src="/images/logo.png"
              alt="Himalaya Online Shop"
              className="h-10 w-auto max-w-[200px] object-contain group-hover:scale-105 transition-transform"
            />
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link to="/" className="hover:text-[#0096C7] transition-colors">
              Storefront
            </Link>
            <a href="#featured" className="hover:text-[#0096C7] transition-colors">
              Featured Items
            </a>
            <a href="#categories" className="hover:text-[#0096C7] transition-colors">
              Departments
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Customer Orders Trigger */}
            {isAuthenticated && (
              <AppButton
                size="middle"
                icon={<FileTextOutlined />}
                onClick={openMyOrders}
              >
                My Orders
              </AppButton>
            )}

            {/* Shopping Bag Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 text-slate-700 hover:text-[#0096C7] rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Shopping Cart"
            >
              <Badge count={cartCount} size="small" offset={[2, -2]}>
                <ShoppingOutlined className="text-xl" />
              </Badge>
            </button>

            {/* User Account / Auth */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {(isSeller || isAdmin) && (
                  <Link
                    to="/admin"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-[#f97316] hover:bg-orange-100 border border-orange-200 text-xs font-bold transition-colors"
                  >
                    <ShopOutlined />
                    <span>{isSeller ? 'Seller Portal' : 'Admin Suite'}</span>
                  </Link>
                )}
                <div
                  className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer"
                  onClick={openMyOrders}
                  title={`Authorized as ${user?.firstName} (${user?.role}) • Session Expiry: ${formattedExpiry || '24h'}`}
                >
                  <Avatar
                    style={{
                      backgroundColor: isSeller ? '#f97316' : '#0284c7',
                      color: '#fff',
                    }}
                    icon={<UserOutlined />}
                    size="small"
                  >
                    {user?.firstName?.[0] || 'U'}
                  </Avatar>
                  <span className="text-xs font-semibold text-slate-800 hidden sm:inline">
                    {user?.firstName}
                  </span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <LogoutOutlined />
                </button>
              </div>
            ) : (
              <Link to="/login">
                <AppButton size="middle">
                  Sign In
                </AppButton>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Customer Orders Modal */}
      <Modal
        open={isOrdersModalOpen}
        onCancel={() => setIsOrdersModalOpen(false)}
        footer={null}
        title={
          <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
            <FileTextOutlined className="text-[#0096C7]" />
            <span>My Order History</span>
          </div>
        }
        width={700}
      >
        <div className="py-2">
          {loadingOrders ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2.5">
                  <div className="flex justify-between">
                    <div className="w-28 h-3.5 bg-slate-200 animate-pulse rounded" />
                    <div className="w-16 h-3.5 bg-slate-200 animate-pulse rounded-full" />
                  </div>
                  <div className="w-48 h-3 bg-slate-200 animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : customerOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <ShoppingOutlined className="text-4xl text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">No orders placed yet</p>
              <p className="text-xs text-slate-400 mt-1">Start shopping on Himalaya Online Shop!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {customerOrders.map((order) => (
                <div
                  key={order._id || order.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-[#0096C7]/40 transition-colors space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#0096C7]">
                        {order.orderNumber}
                      </span>
                      <div className="text-[11px] text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={order.orderStatus} />
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80'}
                            alt={item.name}
                            className="w-9 h-9 rounded object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-semibold text-slate-800">{item.name}</div>
                            <div className="text-slate-400 text-[11px]">Qty: {item.quantity}</div>
                          </div>
                        </div>
                        <div className="font-bold text-slate-800">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary & Tracking */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div>
                      {order.trackingNumber ? (
                        <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                          <CarOutlined className="text-[#0096C7]" />
                          <span>Tracking: {order.trackingNumber}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Preparing for shipment</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 text-xs mr-2">Total Paid:</span>
                      <span className="text-base font-extrabold text-slate-900">
                        ${order.totalAmount?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Main View */}
      <main className="flex-1 w-full px-4 py-8">
        <Outlet />
      </main>

      {/* Features Bar */}
      <div className="border-t border-b border-slate-200 bg-white py-8">
        <div className="w-full px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#0096C7] text-lg shrink-0">
              <CarOutlined />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Fast & Free Shipping</h4>
              <p className="text-xs text-slate-500">On all qualifying orders over $150</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-lg shrink-0">
              <SafetyOutlined />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Secure Checkout</h4>
              <p className="text-xs text-slate-500">256-bit SSL encrypted transactions</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-lg shrink-0">
              <RollbackOutlined />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">30-Day Hassle Free Returns</h4>
              <p className="text-xs text-slate-500">Full money-back satisfaction guarantee</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 text-lg shrink-0">
              <CustomerServiceOutlined />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">24/7 Priority Support</h4>
              <p className="text-xs text-slate-500">Dedicated assistance for all shoppers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 text-slate-500 text-xs">
        <div className="w-full px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="Himalaya Online Shop"
              className="h-7 w-auto max-w-[140px] object-contain"
            />
            <span className="text-slate-300">|</span>
            <span>Enterprise E-Commerce Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-[#0096C7] transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-[#0096C7] transition-colors">
              Register Account
            </Link>
          </div>

          <div>
            &copy; {new Date().getFullYear()} Himalaya Online Shop. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export const StoreLayout = PublicLayout;
export default PublicLayout;
