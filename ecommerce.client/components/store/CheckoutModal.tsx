import React, { useState } from 'react';
import {
  ShoppingOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Radio } from 'antd';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { ecommerceService } from '../../services/EcommerceAPIService';
import { useAuth } from 'auth-client/hooks/useAuth';
import { AppModal, AppInput, AppButton } from 'shared-components';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { cart, cartTotal, clearCart, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [customer, setCustomer] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : '',
    email: user ? user.email : '',
    phone: '',
  });

  const [shipping, setShipping] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
  });

  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'paypal' | 'stripe' | 'cash_on_delivery'>('credit_card');
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<any>(null);

  if (!isOpen) return null;

  const tax = Math.round(cartTotal * 0.08 * 100) / 100;
  const shippingAmount = cartTotal > 150 ? 0 : 15;
  const grandTotal = Math.round((cartTotal + tax + shippingAmount) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.name || !customer.email || !shipping.street || !shipping.city || !shipping.zipCode) {
      showToast('Please complete all required shipping fields', 'error');
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

  return (
    <AppModal
      open={isOpen}
      title={orderComplete ? 'Order Confirmation' : 'Secure Checkout'}
      onCancel={onClose}
      footer={null}
      width={680}
    >
      {orderComplete ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
            <CheckCircleOutlined />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Order Placed Successfully!</h2>
          <p className="text-slate-600 text-xs max-w-md mx-auto">
            Thank you for shopping with Himalaya Online Shop. Your order{' '}
            <span className="font-mono text-[#0096C7] font-bold">{orderComplete.orderNumber}</span>{' '}
            is being processed for dispatch.
          </p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-sm mx-auto text-left text-xs space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Total Paid:</span>
              <span className="font-bold text-[#0096C7]">${orderComplete.totalAmount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Status:</span>
              <span className="capitalize font-semibold text-emerald-600">{orderComplete.orderStatus}</span>
            </div>
          </div>

          <AppButton
            type="primary"
            onClick={() => {
              setOrderComplete(null);
              onClose();
            }}
            style={{ backgroundColor: '#0096C7' }}
          >
            Continue Shopping
          </AppButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Contact */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Contact Information
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AppInput
                label="Full Name *"
                required
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                placeholder="Jane Doe"
              />
              <AppInput
                label="Email Address *"
                type="email"
                required
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                placeholder="jane@example.com"
              />
              <div className="sm:col-span-2">
                <AppInput
                  label="Phone Number"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Shipping Address
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <AppInput
                  label="Street Address *"
                  required
                  value={shipping.street}
                  onChange={(e) => setShipping({ ...shipping, street: e.target.value })}
                  placeholder="123 Market Street, Apt 4B"
                />
              </div>
              <AppInput
                label="City *"
                required
                value={shipping.city}
                onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                placeholder="San Francisco"
              />
              <AppInput
                label="State / Province"
                value={shipping.state}
                onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                placeholder="CA"
              />
              <AppInput
                label="Zip / Postal Code *"
                required
                value={shipping.zipCode}
                onChange={(e) => setShipping({ ...shipping, zipCode: e.target.value })}
                placeholder="94103"
              />
            </div>
          </div>

          {/* Payment */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              3. Payment Method
            </div>
            <Radio.Group
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2"
            >
              <Radio.Button value="credit_card" className="text-center text-xs">Credit Card</Radio.Button>
              <Radio.Button value="stripe" className="text-center text-xs">Stripe</Radio.Button>
              <Radio.Button value="paypal" className="text-center text-xs">PayPal</Radio.Button>
              <Radio.Button value="cash_on_delivery" className="text-center text-xs">Cash on Deliv.</Radio.Button>
            </Radio.Group>
          </div>

          {/* Financial Totals */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Cart Items ({cart.length})</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Sales Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              <span className="text-emerald-600 font-semibold">{shippingAmount === 0 ? 'FREE' : `$${shippingAmount.toFixed(2)}`}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
              <span>Total Amount</span>
              <span className="text-[#0096C7]">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <AppButton onClick={onClose}>
              Cancel
            </AppButton>
            <AppButton
              type="primary"
              htmlType="submit"
              loading={submitting}
              icon={<SafetyCertificateOutlined />}
              style={{ backgroundColor: '#0096C7' }}
            >
              Place Order (${grandTotal.toFixed(2)})
            </AppButton>
          </div>
        </form>
      )}
    </AppModal>
  );
};

export default CheckoutModal;
