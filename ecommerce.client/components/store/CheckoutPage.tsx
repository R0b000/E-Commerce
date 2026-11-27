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
  TagOutlined,
  CloseCircleOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  DollarCircleOutlined,
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

  const [paymentMethod, setPaymentMethod] = useState<
    'credit_card' | 'paypal' | 'stripe' | 'cash_on_delivery' | 'khalti' | 'esewa'
  >('cash_on_delivery');
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<any>(null);

  // Discount / Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    description?: string;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const taxableSubtotal = Math.max(0, cartTotal - discountAmount);
  const tax = Math.round(taxableSubtotal * 0.08 * 100) / 100;
  const shippingAmount = cartTotal > 150 ? 0 : 15;
  const grandTotal = Math.round(Math.max(0, taxableSubtotal + tax + shippingAmount) * 100) / 100;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await ecommerceService.validateCoupon({
        code: couponCode.trim(),
        cartTotal,
      });
      if (res.success && res.data) {
        setAppliedCoupon({
          code: res.data.code,
          discountAmount: res.data.discountAmount,
          description: res.data.description,
        });
        showToast(
          `Promo code "${res.data.code}" applied! You save $${res.data.discountAmount.toFixed(2)}`,
          'success'
        );
      } else {
        showToast(res.messages?.[0] || 'Invalid coupon code', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to apply coupon', 'error');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    showToast('Promo discount removed', 'info');
  };

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
        paymentStatus: 'pending' as const,
        orderStatus: 'pending' as const,
        subtotal: cartTotal,
        taxAmount: tax,
        shippingAmount,
        totalAmount: grandTotal,
      };

      const res = await ecommerceService.createOrder(payload);
      if (res.success && res.data) {
        const orderId = (res.data._id || res.data.id || '') as string;

        if (paymentMethod === 'khalti') {
          showToast('Redirecting to Khalti ePayment gateway...', 'info');
          const khaltiRes = await ecommerceService.initiateKhalti({
            orderId,
            amount: grandTotal,
            customerInfo: customer,
            returnUrl: `${window.location.origin}/payment/verify/khalti?orderId=${orderId}`,
            websiteUrl: window.location.origin,
          });

          if (khaltiRes.success && khaltiRes.data?.paymentUrl) {
            clearCart();
            setIsCartOpen(false);
            window.location.href = khaltiRes.data.paymentUrl;
            return;
          } else {
            showToast(khaltiRes.messages?.[0] || 'Khalti initiation failed', 'error');
          }
        } else if (paymentMethod === 'esewa') {
          showToast('Redirecting to eSewa payment gateway...', 'info');
          const esewaRes = await ecommerceService.initiateEsewa({
            orderId,
            amount: grandTotal,
            taxAmount: tax,
            returnUrl: `${window.location.origin}/payment/verify/esewa?orderId=${orderId}`,
            failureUrl: `${window.location.origin}/checkout?status=failed&orderId=${orderId}`,
          });

          if (esewaRes.success && esewaRes.data?.formFields) {
            clearCart();
            setIsCartOpen(false);

            // Construct and auto-submit the signed form to eSewa gateway
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = esewaRes.data.gatewayUrl;
            Object.entries(esewaRes.data.formFields).forEach(([key, val]) => {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = key;
              input.value = val as string;
              form.appendChild(input);
            });
            document.body.appendChild(form);
            form.submit();
            return;
          } else {
            showToast(esewaRes.messages?.[0] || 'eSewa initiation failed', 'error');
          }
        } else {
          setOrderComplete(res.data);
          clearCart();
          setIsCartOpen(false);
          showToast('Your order has been placed successfully!', 'success');
        }
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
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 font-['Nunito_Sans','Poppins',sans-serif]">
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
      <div className="max-w-2xl mx-auto py-20 px-4 text-center font-['Nunito_Sans','Poppins',sans-serif]">
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
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 font-['Nunito_Sans','Poppins',sans-serif]">
      {/* Back Link & Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-8 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 font-semibold mb-2">
            <Link to="/" className="hover:text-sky-600 transition-colors">Home</Link>
            <span>/</span>
            <Link to="/" className="hover:text-sky-600 transition-colors">Cart</Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">Checkout</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>Secure Checkout</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              <SafetyCertificateOutlined className="text-sm" /> 256-bit Encrypted
            </span>
          </h1>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-sky-600 transition-colors self-start sm:self-auto bg-slate-100 hover:bg-slate-200/80 px-4 py-2.5 rounded-xl"
        >
          <ArrowLeftOutlined />
          <span>Continue Shopping</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Fields (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Customer Information */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <span className="w-9 h-9 rounded-2xl bg-sky-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-sky-600/25 shrink-0">
                  1
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Contact Information
                  </h3>
                  <p className="text-xs font-semibold text-slate-400">
                    Where we should send your order confirmation and dispatch updates
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dorje Tenzing"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-xs"
                    />
                    <UserOutlined className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-xs"
                    />
                    <MailOutlined className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="+977 980-0000000"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-xs"
                    />
                    <PhoneOutlined className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Shipping Destination */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <span className="w-9 h-9 rounded-2xl bg-amber-500 text-white font-black text-sm flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
                  2
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Shipping Address
                  </h3>
                  <p className="text-xs font-semibold text-slate-400">
                    Provide precise address for swift doorstep delivery
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Street Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. 123 Himalayan Way, Ward 4, Thamel"
                      value={shipping.street}
                      onChange={(e) => setShipping({ ...shipping, street: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-xs"
                    />
                    <EnvironmentOutlined className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kathmandu"
                    value={shipping.city}
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    ZIP / Postal Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 44600"
                    value={shipping.zipCode}
                    onChange={(e) => setShipping({ ...shipping, zipCode: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    State / Province
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bagmati Province"
                    value={shipping.state}
                    onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Country
                  </label>
                  <select
                    value={shipping.country}
                    onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-xs cursor-pointer"
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
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <span className="w-9 h-9 rounded-2xl bg-sky-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-sky-600/25 shrink-0">
                  3
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Payment Method
                  </h3>
                  <p className="text-xs font-semibold text-slate-400">
                    Select your preferred secure payment gateway or cash on delivery
                  </p>
                </div>
              </div>

              {/* Payment Method Cards */}
              <div className="space-y-3.5">
                {/* Khalti Digital Wallet */}
                <div
                  onClick={() => setPaymentMethod('khalti')}
                  className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-4 ${
                    paymentMethod === 'khalti'
                      ? 'border-[#5c2d91] bg-purple-50/60 shadow-md ring-2 ring-[#5c2d91]/20'
                      : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Radio checked={paymentMethod === 'khalti'} />
                    <div className="w-10 h-10 rounded-xl bg-[#5c2d91] text-white flex items-center justify-center text-base font-black shadow-sm shrink-0">
                      K
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-black text-slate-900">
                          Khalti Digital Wallet
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#5c2d91] text-white uppercase tracking-wider">
                          Instant ePayment
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        Direct secure payment via Khalti wallet, mobile banking & SCT cards
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block text-xs font-extrabold text-[#5c2d91] bg-purple-100/80 px-3 py-1.5 rounded-xl border border-purple-200 shrink-0">
                    Zero Extra Fee
                  </div>
                </div>

                {/* eSewa Mobile Wallet */}
                <div
                  onClick={() => setPaymentMethod('esewa')}
                  className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-4 ${
                    paymentMethod === 'esewa'
                      ? 'border-[#60bb46] bg-emerald-50/60 shadow-md ring-2 ring-[#60bb46]/20'
                      : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Radio checked={paymentMethod === 'esewa'} />
                    <div className="w-10 h-10 rounded-xl bg-[#60bb46] text-white flex items-center justify-center text-base font-black shadow-sm shrink-0">
                      e
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-black text-slate-900">
                          eSewa Mobile Wallet
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#60bb46] text-white uppercase tracking-wider">
                          Digital Gateway
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        Pay swiftly using your verified eSewa account or linked bank accounts
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block text-xs font-extrabold text-[#3a8b23] bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-200 shrink-0">
                    Instant Gateway
                  </div>
                </div>

                {/* Cash on Delivery (COD) */}
                <div
                  onClick={() => setPaymentMethod('cash_on_delivery')}
                  className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-4 ${
                    paymentMethod === 'cash_on_delivery'
                      ? 'border-[#f97316] bg-orange-50/60 shadow-md ring-2 ring-[#f97316]/20'
                      : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Radio checked={paymentMethod === 'cash_on_delivery'} />
                    <div className="w-10 h-10 rounded-xl bg-[#f97316] text-white flex items-center justify-center text-lg font-black shadow-sm shrink-0">
                      <DollarCircleOutlined />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-black text-slate-900">
                          Cash on Delivery (COD)
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">
                          Doorstep Cash
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        Inspect package upon delivery and pay with cash directly to the courier
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block text-xs font-extrabold text-amber-800 bg-amber-100/80 px-3 py-1.5 rounded-xl border border-amber-200 shrink-0">
                    No Card Needed
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary (5 Columns, Sticky) */}
          <div className="lg:col-span-5 sticky top-20 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-md shadow-slate-200/30">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Order Summary</h3>
                <span className="text-xs font-black px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Items List */}
              <div className="max-h-72 overflow-y-auto space-y-3.5 pr-1 mb-6">
                {cart.map((item) => {
                  const pId = item.product._id || item.product.id;
                  const unitPrice = item.product.salePrice ?? item.product.price;
                  return (
                    <div key={pId} className="flex items-center gap-3.5 p-2 rounded-2xl hover:bg-slate-50 transition-colors">
                      <img
                        src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'}
                        alt={item.product.name}
                        className="w-14 h-14 rounded-xl object-cover bg-slate-50 border border-slate-200 shrink-0 shadow-xs"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {item.product.name}
                        </div>
                        <div className="text-xs font-semibold text-slate-400 mt-0.5">
                          Qty: <span className="font-bold text-slate-700">{item.quantity}</span> × ${unitPrice.toFixed(2)}
                        </div>
                      </div>
                      <div className="font-black text-sm text-slate-900 shrink-0">
                        ${(unitPrice * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Promo / Discount Code */}
              <div className="pt-4 border-t border-slate-100 mb-6">
                <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TagOutlined className="text-sky-600" />
                  Have a Coupon / Promo Code?
                </div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
                    <div className="flex items-center gap-2">
                      <Tag color="success" className="font-mono font-bold tracking-wider text-xs">
                        {appliedCoupon.code}
                      </Tag>
                      <span className="text-emerald-700 font-bold text-xs sm:text-sm">
                        -${appliedCoupon.discountAmount.toFixed(2)} savings applied
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-slate-400 hover:text-rose-500 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <CloseCircleOutlined /> Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. HIMALAYA20"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      className="flex-1 px-4 py-2.5 text-xs sm:text-sm uppercase font-mono font-bold tracking-wider border border-slate-200 bg-slate-50/60 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                    />
                    <button
                      type="button"
                      disabled={validatingCoupon || !couponCode.trim()}
                      onClick={handleApplyCoupon}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs sm:text-sm font-extrabold rounded-xl cursor-pointer transition-all shadow-xs"
                    >
                      {validatingCoupon ? <Spin size="small" /> : 'Apply Code'}
                    </button>
                  </div>
                )}
              </div>

              {/* Price Calculations */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-600">Subtotal</span>
                  <span className="font-extrabold text-slate-900">${cartTotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-sm text-emerald-600 font-bold">
                    <span className="flex items-center gap-1">
                      <TagOutlined /> Coupon Discount ({appliedCoupon?.code})
                    </span>
                    <span className="font-extrabold">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-600">Estimated Sales Tax (8%)</span>
                  <span className="font-extrabold text-slate-900">${tax.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-600">Standard Shipping</span>
                  <span className="font-extrabold text-slate-900">
                    {shippingAmount === 0 ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-xs font-black">
                        FREE (Over $150)
                      </span>
                    ) : (
                      `$${shippingAmount.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-200/90 flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-black text-slate-900 uppercase tracking-wide">
                      Grand Total
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Including taxes & shipping
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-2xl sm:text-3xl text-sky-600 tracking-tight">
                      ${grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-4 px-6 rounded-2xl text-white font-black text-sm sm:text-base uppercase tracking-wider transition-all shadow-lg hover:shadow-xl hover:brightness-105 active:scale-[0.99] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2.5 ${
                    paymentMethod === 'khalti'
                      ? 'bg-gradient-to-r from-[#5c2d91] to-[#7b3dbd] shadow-purple-900/25 hover:shadow-purple-900/35'
                      : paymentMethod === 'esewa'
                      ? 'bg-gradient-to-r from-[#60bb46] to-[#4ea835] shadow-emerald-800/25 hover:shadow-emerald-800/35'
                      : 'bg-gradient-to-r from-sky-600 to-sky-500 shadow-sky-600/25 hover:shadow-sky-600/35'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Spin size="small" />
                      <span>
                        {paymentMethod === 'khalti'
                          ? 'Connecting Khalti Gateway...'
                          : paymentMethod === 'esewa'
                          ? 'Connecting eSewa Gateway...'
                          : 'Confirming Order...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <LockOutlined className="text-base" />
                      <span>
                        {paymentMethod === 'khalti'
                          ? `Pay with Khalti ($${grandTotal.toFixed(2)})`
                          : paymentMethod === 'esewa'
                          ? `Pay with eSewa ($${grandTotal.toFixed(2)})`
                          : `Place Order • Cash on Delivery ($${grandTotal.toFixed(2)})`}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-2">
                  <SafetyCertificateOutlined className="text-emerald-600 text-sm" />
                  <span className="text-xs font-bold text-slate-700">100% Genuine</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-2">
                  <CarOutlined className="text-sky-600 text-sm" />
                  <span className="text-xs font-bold text-slate-700">Doorstep Delivery</span>
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
