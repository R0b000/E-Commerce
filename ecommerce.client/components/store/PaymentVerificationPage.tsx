import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ShoppingOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { ecommerceService } from '../../services/EcommerceAPIService';
import { AppButton } from 'shared-components';

export const PaymentVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { gateway: paramGateway } = useParams<{ gateway?: string }>();
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [orderData, setOrderData] = useState<any>(null);

  const gateway = (paramGateway || searchParams.get('gateway') || 'khalti').toLowerCase();
  const orderId = searchParams.get('orderId') || '';
  const pidx = searchParams.get('pidx') || '';
  const encodedData = searchParams.get('data') || '';

  useEffect(() => {
    let isMounted = true;

    const performVerification = async () => {
      setVerifying(true);
      try {
        if (gateway === 'khalti') {
          const res = await ecommerceService.verifyKhalti({
            pidx: pidx || undefined,
            orderId: orderId || undefined,
          });

          if (isMounted) {
            if (res.success && res.data) {
              setSuccess(true);
              setOrderData(res.data);
            } else {
              setSuccess(false);
              setErrorMessage(res.messages?.[0] || 'Khalti payment verification was rejected.');
            }
          }
        } else if (gateway === 'esewa') {
          const res = await ecommerceService.verifyEsewa({
            encodedData: encodedData || undefined,
            orderId: orderId || undefined,
          });

          if (isMounted) {
            if (res.success && res.data) {
              setSuccess(true);
              setOrderData(res.data);
            } else {
              setSuccess(false);
              setErrorMessage(res.messages?.[0] || 'eSewa payment verification was rejected.');
            }
          }
        } else {
          if (isMounted) {
            setSuccess(false);
            setErrorMessage('Unknown payment gateway provider.');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setSuccess(false);
          setErrorMessage(
            err.response?.data?.messages?.[0] || 'An error occurred during payment verification.'
          );
        }
      } finally {
        if (isMounted) {
          setVerifying(false);
        }
      }
    };

    performVerification();

    return () => {
      isMounted = false;
    };
  }, [gateway, orderId, pidx, encodedData]);

  const isKhalti = gateway === 'khalti';
  const brandColor = isKhalti ? '#5c2d91' : '#60bb46'; // Khalti Purple vs eSewa Green

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 font-['Nunito_Sans','Poppins',sans-serif]">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        {/* Gateway Brand Top Bar */}
        <div
          className="h-2.5 w-full"
          style={{ backgroundColor: brandColor }}
        />

        <div className="p-8 sm:p-10 text-center">
          {verifying ? (
            <div className="py-8 space-y-4">
              <div
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl animate-pulse"
                style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
              >
                <LoadingOutlined spin />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Verifying {isKhalti ? 'Khalti' : 'eSewa'} Payment...
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Securely communicating with {isKhalti ? 'Khalti ePayment API' : 'eSewa ePay Gateway'} to validate transaction settlement.
              </p>
            </div>
          ) : success ? (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner border border-emerald-100 animate-bounce">
                <CheckCircleOutlined />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-2">
                  <SafetyCertificateOutlined /> Payment Confirmed & Verified
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Thank You for Your Order!
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Your self-service digital payment via{' '}
                  <strong style={{ color: brandColor }}>
                    {isKhalti ? 'Khalti' : 'eSewa'}
                  </strong>{' '}
                  has been verified and credited.
                </p>
              </div>

              {/* Order Receipt Box */}
              {orderData && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 text-left space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Order Number</span>
                    <span className="font-mono font-bold text-slate-900">
                      {orderData.orderNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Payment Gateway</span>
                    <span className="font-semibold uppercase" style={{ color: brandColor }}>
                      {gateway}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Transaction Code</span>
                    <span className="font-mono text-slate-700 truncate max-w-[200px]">
                      {orderData.paymentDetails?.transactionId || orderData.paymentDetails?.pidx || 'Settled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 font-bold text-sm">
                    <span className="text-slate-900">Total Settled</span>
                    <span className="text-[#0284c7]">
                      ${Number(orderData.totalAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link to="/" className="w-full sm:w-auto">
                  <AppButton
                    size="large"
                    type="primary"
                    icon={<ShoppingOutlined />}
                    style={{ backgroundColor: '#f97316' }}
                    className="w-full sm:w-auto"
                  >
                    Continue Shopping
                  </AppButton>
                </Link>

                <Link to="/admin/orders" className="w-full sm:w-auto">
                  <AppButton
                    size="large"
                    icon={<FileTextOutlined />}
                    className="w-full sm:w-auto"
                  >
                    View in Orders
                  </AppButton>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner border border-rose-100">
                <CloseCircleOutlined />
              </div>

              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 mb-2">
                  Verification Failed
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Payment Not Completed
                </h2>
                <p className="text-xs text-rose-600 mt-2 font-medium bg-rose-50 p-3 rounded-xl border border-rose-200">
                  {errorMessage || 'Unable to confirm payment from gateway provider.'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <Link to="/checkout">
                  <AppButton type="primary" size="large" style={{ backgroundColor: '#0284c7' }}>
                    Return to Checkout
                  </AppButton>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentVerificationPage;
