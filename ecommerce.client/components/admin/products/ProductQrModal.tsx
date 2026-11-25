import React, { useMemo } from 'react';
import {
  QrcodeOutlined,
  CopyOutlined,
  DownloadOutlined,
  LinkOutlined,
  PrinterOutlined,
  ShoppingOutlined,
  StarFilled,
} from '@ant-design/icons';
import { QRCode, Tag, Tooltip } from 'antd';
import { Product } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import { AppModal } from 'shared-components';

export interface ProductQrModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

export const ProductQrModal: React.FC<ProductQrModalProps> = ({ product, open, onClose }) => {
  const { showToast } = useToast();

  const productViewUrl = useMemo(() => {
    if (!product) return '';
    const id = product._id || product.id || product.sku;
    return `${window.location.origin}/?product=${encodeURIComponent(id)}`;
  }, [product]);

  const handleDownload = (elementId: string, filename: string) => {
    const container = document.getElementById(elementId);
    const canvas = container?.querySelector<HTMLCanvasElement>('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = `${filename}.png`;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('QR Code downloaded successfully as PNG!', 'success');
      return;
    }
    const svg = container?.querySelector<SVGElement>('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const a = document.createElement('a');
      a.download = `${filename}.svg`;
      a.href = svgUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('QR Code downloaded successfully as SVG!', 'success');
      return;
    }
    showToast('Failed to download QR code image', 'error');
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  if (!product) return null;

  const productImage = product.images?.[0] || '';
  const priceDisplay = product.salePrice ? product.salePrice.toFixed(2) : product.price.toFixed(2);

  return (
    <AppModal
      open={open}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0096C7] flex items-center justify-center text-base border border-sky-100">
            <QrcodeOutlined />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">
              Product QR Code
            </h3>
            <p className="text-[11px] text-slate-400 font-normal">
              Direct QR code for scanning and accessing this product
            </p>
          </div>
        </div>
      }
      onCancel={onClose}
      footer={null}
      width={520}
    >
      <div className="space-y-4 py-1 text-slate-700 font-['Poppins','Inter',sans-serif]">
        {/* Product Identity Banner */}
        <div className="p-3 bg-gradient-to-r from-sky-50/60 via-slate-50 to-amber-50/40 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0 shadow-xs">
              {productImage ? (
                <img
                  src={productImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <ShoppingOutlined className="text-xl" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#0096C7] bg-white px-1.5 py-0.5 rounded border border-sky-100">
                  {product.sku}
                </span>
                {product.brand && (
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    {product.brand}
                  </span>
                )}
              </div>
              <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">
                {product.name}
              </h4>
              <div className="flex items-center gap-2 text-xs mt-0.5">
                <span className="text-xs font-black text-slate-900">
                  ${priceDisplay}
                </span>
                {product.salePrice && (
                  <span className="text-slate-400 line-through text-[10px]">
                    ${product.price.toFixed(2)}
                  </span>
                )}
                <div className="flex items-center gap-1 text-amber-500 text-[10px] font-semibold ml-1">
                  <StarFilled />
                  <span>{product.rating || 5.0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Tooltip title="Print Product QR Display Card">
              <button
                type="button"
                onClick={handlePrint}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <PrinterOutlined className="text-slate-500" />
                <span>Print</span>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Single Dedicated Product QR Showcase */}
        <div className="p-5 rounded-xl border border-sky-100 bg-gradient-to-b from-sky-50/40 to-white space-y-4 shadow-xs">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-sky-100">
            <div className="flex items-center gap-1.5">
              <ShoppingOutlined className="text-[#0096C7]" />
              <span className="text-xs font-bold text-slate-800">
                Direct Product Scanner
              </span>
            </div>
            <Tag color="cyan" className="m-0 font-bold text-[10px]">
              Direct Product
            </Tag>
          </div>

          {/* QR Code Container */}
          <div className="py-2 flex justify-center">
            <div
              id="qr-container-product"
              className="p-3.5 bg-white rounded-xl border-2 border-sky-200/80 shadow-md inline-block transition-transform hover:scale-102"
            >
              <QRCode
                value={productViewUrl}
                size={184}
                icon={productImage || undefined}
                errorLevel="H"
                bordered={false}
              />
            </div>
          </div>

          {/* Scannable Target URL */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
              <span>Product Direct URL:</span>
              <button
                type="button"
                onClick={() => handleCopy(productViewUrl, 'Product URL')}
                className="text-[#0096C7] hover:underline flex items-center gap-1 cursor-pointer font-medium lowercase"
              >
                <CopyOutlined /> copy link
              </button>
            </div>
            <input
              type="text"
              readOnly
              value={productViewUrl}
              className="w-full text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 select-all focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                handleDownload(
                  'qr-container-product',
                  `QR-Product-${product.sku || product.name.replace(/[^a-zA-Z0-9]/g, '-')}`
                )
              }
              className="flex-1 py-2 px-3 rounded-lg bg-[#0096C7] hover:bg-[#0083ae] active:bg-[#007096] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <DownloadOutlined />
              <span>Download QR PNG</span>
            </button>

            <a
              href={productViewUrl}
              target="_blank"
              rel="noreferrer"
              className="py-2 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              title="Test Product Link in New Tab"
            >
              <LinkOutlined />
              <span>Open</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="text-slate-500">Scanning opens this item directly in the storefront.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition-colors cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </AppModal>
  );
};

export default ProductQrModal;
