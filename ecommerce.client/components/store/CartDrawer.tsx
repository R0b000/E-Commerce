import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusOutlined,
  CloseOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { Badge, Drawer } from 'antd';
import { useCart } from '../../context/CartContext';
import { AppButton } from 'shared-components';

export const CartDrawer: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, cartCount, cartTotal, isCartOpen, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <Drawer
      zIndex={10005}
      contentWrapperStyle={{ zIndex: 10005, pointerEvents: 'auto' }}
      title={
        <div className="flex items-center gap-2">
          <ShoppingOutlined className="text-[#0284c7] text-lg" />
          <span className="font-bold text-slate-900 text-base">Your Shopping Bag</span>
          <Badge count={cartCount} style={{ backgroundColor: '#0284c7' }} />
        </div>
      }
      placement="right"
      onClose={() => setIsCartOpen(false)}
      open={isCartOpen}
      width={420}
      footer={
        cart.length > 0 ? (
          <div className="p-2 space-y-3 font-['Nunito_Sans','Poppins',sans-serif]">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Items Total</span>
              <span className="font-bold text-slate-900">${cartTotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Estimated Shipping</span>
              <span className="text-emerald-600 font-medium">
                {cartTotal > 150 ? 'FREE Nationwide' : '$15.00'}
              </span>
            </div>

            <AppButton
              type="primary"
              size="large"
              block
              icon={<ArrowRightOutlined />}
              onClick={handleProceedToCheckout}
              style={{ backgroundColor: '#0284c7' }}
            >
              Proceed to Checkout
            </AppButton>
          </div>
        ) : null
      }
    >
      <div className="space-y-3.5 font-['Nunito_Sans','Poppins',sans-serif]">
        {cart.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <ShoppingOutlined className="text-2xl" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Your bag is empty</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Explore our handcrafted catalog to add items to your cart.
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const pId = item.product.id || item.product._id;
            const unitPrice = item.product.salePrice ?? item.product.price;
            const lineTotal = unitPrice * item.quantity;

            return (
              <div
                key={pId}
                className="p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-3 shadow-xs"
              >
                <img
                  src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                  alt={item.product.name}
                  className="w-14 h-14 rounded-lg object-cover bg-slate-50 border border-slate-200 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-slate-900 truncate">
                    {item.product.name}
                  </div>
                  <div className="text-xs text-[#0284c7] font-bold mt-0.5">
                    ${unitPrice.toFixed(2)}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center border border-slate-200 rounded-md bg-slate-50">
                      <button
                        onClick={() => updateQuantity(pId, item.quantity - 1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        <MinusOutlined className="text-[10px]" />
                      </button>
                      <span className="w-5 text-center text-xs font-semibold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(pId, item.quantity + 1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        <PlusOutlined className="text-[10px]" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(pId)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Remove"
                    >
                      <DeleteOutlined className="text-xs" />
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-sm text-slate-900">${lineTotal.toFixed(2)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Drawer>
  );
};

export default CartDrawer;
