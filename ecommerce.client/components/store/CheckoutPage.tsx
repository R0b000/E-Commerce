import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
  CreditCardOutlined,
  CarOutlined,
  LockOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { Radio, Spin, Tag, Divider } from 'antd';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { ecommerceService } from '../../services/EcommerceAPIService';
import { useAuth } from 'auth-client/hooks/useAuth';
import { AppCard, AppInput, AppButton } from 'shared-components';

export const CheckoutPage: React.FC = () => {
  const { cart, cartTotal, clearCart, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState({
    name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    email: user ? user.email : '',
    phone: '',
  });

  const [shipping, setShipping] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Nepal',
  });

  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'paypal' | 'stripe' | 'cash_on_delivery'>('credit_card');
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<any>(null);

  const tax = Math.round(cartTotal * 0.08 * 100) / 100;
  const shippingAmount = cartTotal > 150 ? 0 : 15;
  const grandTotal = Math.round((cartTotal + tax + shippingAmount) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.name || !customer.email || !shipping.street || !shipping.city || !shipping.zipCode) {
      showToast('Please fill in all required shipping and contact fields', 'error');
      return;
    }

    if (cart.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const items = cart.map((item) => ({
        product: item.product.id || item.product._id,
        name: item.product.name,
        price: item.product.salePrice ?? item.product.price,
        quantity: item.quantity,
        image: item.product.images?.[0] || '',
      }));

      const payload = {
        customer,
        shippingAddress: shipping,
        items,
        paymentMethod,
        paymentStatus: (paymentMethod === 'cash_on_delivery' ? 'pending' : 'paid') as 'pending' | 'paid',
        orderStatus: 'processing' as const,
        subtotal: cartTotal,
        taxAmount: tax,
        shippingAmount,
        totalAmount: grandTotal,
      };

      const res = await ecommerceService.createOrder(payload);
      if (res.success && res.data) {
        setOrderComplete(res.data);
        clearCart();
        setIsCartOpen(false);
        showToast('Your order has been placed successfully!', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to place order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Order Success Screen
  if (orderComplete) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 font-['Poppins','Inter',sans-serif]">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm text-center">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-xs border border-emerald-100">
            <CheckCircleOutlined />
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            Order Confirmed
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 mb-2">
            Thank You for Your Order!
          </h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            A confirmation receipt and tracking code have been dispatched to{' '}
            <strong className="text-slate-700">{orderComplete.customer?.email || customer.email}</strong>.
          </p>

          <div className="my-8 p-6 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-left max-w-xl mx-auto space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <span className="text-xs text-slate-500 font-medium">Order Number:</span>
              <span className="font-mono font-bold text-xs text-[#0284c7]">
                {orderComplete.orderNumber || 'ORD-NEW-2026'}
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <span className="text-xs text-slate-500 font-medium">Delivery Recipient:</span>
              <span className="font-semibold text-xs text-slate-800">
                {orderComplete.customer?.name || customer.name}
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <span className="text-xs text-slate-500 font-medium">Shipping Destination:</span>
              <span className="font-semibold text-xs text-slate-800">
                {shipping.street}, {shipping.city}, {shipping.zipCode}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500 font-medium">Total Paid:</span>
              <span className="font-black text-sm text-slate-900">
                ${(orderComplete.totalAmount || grandTotal).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/">
              <AppButton type="primary" size="large" style={{ backgroundColor: '#0284c7' }}>
                Continue Shopping
              </AppButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Empty Cart State
  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center font-['Poppins','Inter',sans-serif]">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-2xl mx-auto mb-4">
            <ShoppingOutlined />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Your Bag is Empty</h2>
          <p className="text-slate-500 text-xs mb-6 max-w-sm mx-auto">
            Explore authentic Himalayan handicrafts, organic teas, and singing bowls before checkout.
          </p>
          <Link to="/">
            <AppButton type="primary" size="large" style={{ backgroundColor: '#f97316' }}>
              Explore Catalog
            </AppButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-6 font-['Poppins','Inter',sans-serif]">
      {/* Back Link & Breadcrumb Header */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/" className="hover:text-[#0284c7] transition-colors">Home</Link>
            <span>/</span>
            <span>Cart</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Secure Checkout</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Checkout & Order Finalization
          </h1>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#0284c7] transition-colors"
        >
          <ArrowLeftOutlined />
          <span>Back to Store</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Fields (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Customer Information */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
                <span className="w-7 h-7 rounded-full bg-blue-50 text-[#0284c7] font-bold text-xs flex items-center justify-center border border-blue-200">
                  1
                </span>
                <h3 className="text-sm font-bold text-slate-900">Contact Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dorje Tenzing"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0284c7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0284c7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+977 980-0000000"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0284c7]"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Shipping Destination */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
                <span className="w-7 h-7 rounded-full bg-orange-50 text-[#f97316] font-bold text-xs flex items-center justify-center border border-orange-200">
                  2
                </span>
                <h3 className="text-sm font-bold text-slate-900">Shipping Address</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="123 Himalayan Way, Thamel"
                    value={shipping.street}
                    onChange={(e) => setShipping({ ...shipping, street: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0284c7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="Kathmandu"
                    value={shipping.city}
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0284c7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ZIP / Postal Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="44600"
                    value={shipping.zipCode}
                    onChange={(e) => setShipping({ ...shipping, zipCode: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0284c7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State / Province</label>
                  <input
                    type="text"
                    placeholder="Bagmati Province"
                    value={shipping.state}
                    onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0284c7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                  <select
                    value={shipping.country}
                    onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#0284c7]"
                  >
                    <option value="Nepal">Nepal</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3: Payment Method */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
                <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center border border-emerald-200">
                  3
                </span>
                <h3 className="text-sm font-bold text-slate-900">Payment Selection</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                    paymentMethod === 'credit_card'
                      ? 'border-[#0284c7] bg-blue-50/50 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Radio checked={paymentMethod === 'credit_card'} />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Credit / Debit Card</div>
                    <div className="text-[10px] text-slate-400">Visa, Mastercard, Amex</div>
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod('stripe')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                    paymentMethod === 'stripe'
                      ? 'border-[#0284c7] bg-blue-50/50 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Radio checked={paymentMethod === 'stripe'} />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Stripe Checkout</div>
                    <div className="text-[10px] text-slate-400">Direct encrypted billing</div>
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod('paypal')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                    paymentMethod === 'paypal'
                      ? 'border-[#0284c7] bg-blue-50/50 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Radio checked={paymentMethod === 'paypal'} />
                  <div>
                    <div className="text-xs font-bold text-slate-900">PayPal</div>
                    <div className="text-[10px] text-slate-400">Digital wallet payment</div>
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod('cash_on_delivery')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                    paymentMethod === 'cash_on_delivery'
                      ? 'border-[#f97316] bg-orange-50/50 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Radio checked={paymentMethod === 'cash_on_delivery'} />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Cash on Delivery</div>
                    <div className="text-[10px] text-slate-400">Pay upon package arrival</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary (5 Columns, Sticky) */}
          <div className="lg:col-span-5 sticky top-20 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Order Summary</h3>
                <span className="text-xs text-slate-400 font-semibold">{cart.length} items</span>
              </div>

              {/* Items List */}
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1 mb-5">
                {cart.map((item) => {
                  const pId = item.product._id || item.product.id;
                  const unitPrice = item.product.salePrice ?? item.product.price;
                  return (
                    <div key={pId} className="flex items-center gap-3">
                      <img
                        src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-50 border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {item.product.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Qty: {item.quantity} × ${unitPrice.toFixed(2)}
                        </div>
                      </div>
                      <div className="font-bold text-xs text-slate-900">
                        ${(unitPrice * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Calculations */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Estimated Tax (8%):</span>
                  <span className="font-semibold text-slate-800">${tax.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Express Shipping:</span>
                  <span className="font-semibold text-slate-800">
                    {shippingAmount === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE (Over $150)</span>
                    ) : (
                      `$${shippingAmount.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-sm">
                  <span className="font-bold text-slate-900">Grand Total:</span>
                  <span className="font-black text-lg text-[#0284c7]">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Spin size="small" />
                      <span>Securing Order...</span>
                    </>
                  ) : (
                    <>
                      <LockOutlined />
                      <span>Place Order (${grandTotal.toFixed(2)})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-[10px] text-slate-500">
                <div className="flex items-center justify-center gap-1">
                  <SafetyCertificateOutlined className="text-emerald-500" />
                  <span>256-bit Encrypted</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <CarOutlined className="text-[#0284c7]" />
                  <span>Tracked Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
