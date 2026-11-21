import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShopOutlined,
  CheckCircleOutlined,
  SaveOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  FileTextOutlined,
  StarFilled,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { Tag, Spin, Divider } from 'antd';
import { useAuth } from 'auth-client/hooks/useAuth';
import { authAPIService } from 'auth-client/services/AuthAPIService';
import { useToast } from '../../../context/ToastContext';
import { AppCard, AppButton, PageHeader } from 'shared-components';

export const SellerProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [vendorData, setVendorData] = useState({
    vendorName: user?.vendorProfile?.vendorName || (user ? `${user.firstName}'s Himalayan Goods` : 'Himalayan Artisan Store'),
    businessLocation: user?.vendorProfile?.businessLocation || 'Kathmandu, Bagmati, Nepal',
    phone: user?.vendorProfile?.phone || '+977 980-1234567',
    taxId: user?.vendorProfile?.taxId || 'PAN-98214-NP',
    businessCategory: user?.vendorProfile?.businessCategory || 'Authentic Handicrafts & Herbal Teas',
    description:
      user?.vendorProfile?.description ||
      'Master artisan workshop specializing in ethical hand-beaten singing bowls, pashmina wool shawls, and organic Himalayan teas direct from village co-ops.',
    documentUrl:
      user?.vendorProfile?.documentUrl ||
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.vendorProfile) {
      setVendorData((prev) => ({
        ...prev,
        ...user.vendorProfile,
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authAPIService.updateVendorProfile(vendorData);
      if (res.success) {
        showToast('Vendor profile & storefront settings updated successfully', 'success');
        await refreshUser();
      } else {
        showToast(res.messages?.[0] || 'Failed to update profile', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to update seller profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full font-['Nunito_Sans','Poppins',sans-serif]">
      {/* Header */}
      <PageHeader
        title="Seller & Vendor Profile"
        description="Manage your storefront branding, verified business identity, artisan certifications, and dual-persona shopper settings."
        breadcrumbs={[{ label: 'Admin', path: '/admin' }, { label: 'Accounts', path: '/admin/customers' }, { label: 'Seller Profile' }]}
      />

      {/* Dual Persona Customer Privileges Notice */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0284c7] flex items-center justify-center text-base shrink-0 border border-blue-100">
            <ShopOutlined />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900">Dual-Persona Access: Seller & Customer</h3>
              <Tag color="success" className="text-[10px] font-semibold m-0">Active</Tag>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              As an authorized Seller, you retain full Customer privileges. You can browse the public storefront, place customer orders, and track deliveries.
            </p>
          </div>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shrink-0"
        >
          <span>Open Storefront</span>
          <ArrowRightOutlined className="text-[10px]" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Vendor Profile Form (8 Columns) */}
        <div className="lg:col-span-8">
          <AppCard className="border border-slate-200/80 rounded-2xl shadow-xs p-6 bg-white">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Storefront Branding & Details
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Information displayed to customers on your public artisan vendor storefront.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-orange-100 text-[#f97316] font-bold text-xs border border-orange-200">
                Verified Artisan
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Store / Vendor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={vendorData.vendorName}
                    onChange={(e) => setVendorData({ ...vendorData, vendorName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0284c7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Craft / Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={vendorData.businessCategory}
                    onChange={(e) => setVendorData({ ...vendorData, businessCategory: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0284c7]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Storefront Description & Artisan Heritage
                  </label>
                  <textarea
                    rows={3}
                    value={vendorData.description}
                    onChange={(e) => setVendorData({ ...vendorData, description: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0284c7] leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Workshop / Business Location
                  </label>
                  <input
                    type="text"
                    value={vendorData.businessLocation}
                    onChange={(e) => setVendorData({ ...vendorData, businessLocation: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0284c7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Support Phone
                  </label>
                  <input
                    type="text"
                    value={vendorData.phone}
                    onChange={(e) => setVendorData({ ...vendorData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0284c7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business Tax ID / PAN / VAT
                  </label>
                  <input
                    type="text"
                    value={vendorData.taxId}
                    onChange={(e) => setVendorData({ ...vendorData, taxId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:border-[#0284c7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Banner / Showcase Image URL
                  </label>
                  <input
                    type="url"
                    value={vendorData.documentUrl}
                    onChange={(e) => setVendorData({ ...vendorData, documentUrl: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0284c7]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <AppButton
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saving}
                  style={{ backgroundColor: '#0284c7' }}
                >
                  Save Vendor Profile
                </AppButton>
              </div>
            </form>
          </AppCard>
        </div>

        {/* Right Column: Live Storefront Card Preview (4 Columns) */}
        <div className="lg:col-span-4 space-y-4">
          <AppCard className="border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden p-0 bg-white">
            <div className="h-28 w-full bg-gradient-to-r from-sky-600 via-[#0096c7] to-cyan-500 relative overflow-hidden">
              <img
                src={vendorData.documentUrl || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600'}
                alt="Banner"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute top-3 right-3">
                <Tag color="success" className="font-bold text-[10px] uppercase shadow-sm">
                  Verified
                </Tag>
              </div>
            </div>

            <div className="p-5 pt-3 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-[#f97316] flex items-center justify-center text-lg font-bold -mt-8 shadow-sm">
                  <ShopOutlined />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 leading-tight">
                    {vendorData.vendorName}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {vendorData.businessCategory}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                {vendorData.description}
              </p>

              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <EnvironmentOutlined className="text-slate-400" />
                  <span className="truncate">{vendorData.businessLocation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneOutlined className="text-slate-400" />
                  <span>{vendorData.phone}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <FileTextOutlined className="text-slate-400" />
                  <span>Tax ID: {vendorData.taxId}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <StarFilled />
                  <span>4.9 / 5.0 Rating</span>
                </div>
                <span className="text-slate-400 font-medium">100% Fair Trade</span>
              </div>
            </div>
          </AppCard>
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;
