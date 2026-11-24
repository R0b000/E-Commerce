import React, { useMemo } from 'react';
import {
  QrcodeOutlined,
  CopyOutlined,
  DownloadOutlined,
  LinkOutlined,
  PrinterOutlined,
  ShoppingOutlined,
  GlobalOutlined,
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

  const websiteUrl = useMemo(() => {
    return `${window.location.origin}/`;
  }, []);

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
              Advertisement & Marketing QR Hub
            </h3>
            <p className="text-[11px] text-slate-400 font-normal">
              High-resolution promotional QR codes for banners, print collateral, social ads & packaging
            </p>
          </div>
        </div>
      }
      onCancel={onClose}
      footer={null}
      width={780}
    >
      <div className="space-y-4 py-1 text-slate-700 font-['Poppins','Inter',sans-serif]">
        {/* Product Identity Banner */}
        <div className="p-3.5 bg-gradient-to-r from-sky-50/60 via-slate-50 to-amber-50/40 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0 shadow-xs">
              {productImage ? (
                <img
                  src={productImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <ShoppingOutlined className="text-2xl" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#0096C7] bg-white px-2 py-0.5 rounded border border-sky-100">
                  {product.sku}
                </span>
                {product.brand && (
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    {product.brand}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-900 truncate mt-0.5">
                {product.name}
              </h4>
              <div className="flex items-center gap-2 text-xs mt-0.5">
                <span className="text-sm font-black text-slate-900">
                  ${priceDisplay}
                </span>
                {product.salePrice && (
                  <span className="text-slate-400 line-through text-[11px]">
                    ${product.price.toFixed(2)}
                  </span>
                )}
                <div className="flex items-center gap-1 text-amber-500 text-[11px] font-semibold ml-1">
                  <StarFilled />
                  <span>{product.rating || 5.0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Tooltip title="Print Table Display Tent / Promotional Flyer">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <PrinterOutlined className="text-slate-500" />
                <span>Print Display Card</span>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Dual QR Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Direct Product Showcase QR */}
          <div className="p-4 rounded-xl border border-sky-100 bg-gradient-to-b from-sky-50/40 to-white space-y-3 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-sky-100">
                <div className="flex items-center gap-1.5">
                  <ShoppingOutlined className="text-[#0096C7]" />
                  <span className="text-xs font-bold text-slate-800">
                    Product View Mode QR
                  </span>
                </div>
                <Tag color="cyan" className="m-0 font-bold text-[10px]">
                  Direct Product
                </Tag>
              </div>

              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                Directly opens this product in <strong>Full Shopping View Mode</strong> with instant &apos;Add to Bag&apos;. Ideal for product packaging, specific flyers, and item ads.
              </p>

              {/* QR Code Container */}
              <div className="py-3 flex justify-center">
                <div
                  id="qr-container-product"
                  className="p-3 bg-white rounded-xl border-2 border-sky-200/80 shadow-md inline-block transition-transform hover:scale-102"
                >
                  <QRCode
                    value={productViewUrl}
                    size={168}
                    icon={productImage || undefined}
                    errorLevel="H"
                    bordered={false}
                  />
                </div>
              </div>

              {/* Scannable Target URL */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
                  <span>Target Destination:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(productViewUrl, 'Product View URL')}
                    className="text-[#0096C7] hover:underline flex items-center gap-1 cursor-pointer font-medium lowercase"
                  >
                    <CopyOutlined /> copy
                  </button>
                </div>
                <input
                  type="text"
                  readOnly
                  value={productViewUrl}
                  className="w-full text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 select-all focus:outline-none"
                />
              </div>
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
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#0096C7] hover:bg-[#0083ae] active:bg-[#007096] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <DownloadOutlined />
                <span>Download PNG</span>
              </button>

              <a
                href={productViewUrl}
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                title="Test Product View in New Tab"
              >
                <LinkOutlined />
                <span>Test</span>
              </a>
            </div>
          </div>

          {/* Card 2: Store Website Homepage QR */}
          <div className="p-4 rounded-xl border border-emerald-100 bg-gradient-to-b from-emerald-50/40 to-white space-y-3 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-emerald-100">
                <div className="flex items-center gap-1.5">
                  <GlobalOutlined className="text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Store Website URL QR
                  </span>
                </div>
                <Tag color="green" className="m-0 font-bold text-[10px]">
                  Storefront Portal
                </Tag>
              </div>

              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                Directs customers to the <strong>Current Storefront Website</strong> and full catalog. Ideal for general brand advertisements, storefront windows, and business cards.
              </p>

              {/* QR Code Container */}
              <div className="py-3 flex justify-center">
                <div
                  id="qr-container-website"
                  className="p-3 bg-white rounded-xl border-2 border-emerald-200/80 shadow-md inline-block transition-transform hover:scale-102"
                >
                  <QRCode
                    value={websiteUrl}
                    size={168}
                    errorLevel="H"
                    bordered={false}
                  />
                </div>
              </div>

              {/* Scannable Target URL */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
                  <span>Target Destination:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(websiteUrl, 'Website URL')}
                    className="text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer font-medium lowercase"
                  >
                    <CopyOutlined /> copy
                  </button>
                </div>
                <input
                  type="text"
                  readOnly
                  value={websiteUrl}
                  className="w-full text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 select-all focus:outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownload('qr-container-website', 'QR-Store-Website')}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <DownloadOutlined />
                <span>Download PNG</span>
              </button>

              <a
                href={websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                title="Visit Storefront in New Tab"
              >
                <LinkOutlined />
                <span>Visit</span>
              </a>
            </div>
          </div>
        </div>

        {/* Marketing Tips Footer */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Advertisement Tip:</span>
            <span>Download PNG files at 300 DPI ready for Adobe Photoshop, Canva, or physical print shops.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition-colors cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </AppModal>
  );
};

export default ProductQrModal;
