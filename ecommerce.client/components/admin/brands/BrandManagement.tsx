import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  TagOutlined,
  ShopOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { Popconfirm, Breadcrumb, Switch } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { Product } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import {
  AppTable,
  AppButton,
  AppInput,
  AppSelect,
  AppModal,
  TableSkeleton,
  StatusBadge,
} from 'shared-components';
import { BrandItem, BrandManagementProps } from './BrandManagement.types';

const INITIAL_POPULAR_BRANDS = [
  { name: 'AeroPulse Audio', tag: 'AeroPulse Audio', desc: 'Premium wireless headphones and audiophile gear' },
  { name: 'Apex Tech', tag: 'Apex Tech', desc: 'High-performance computing and smart electronics' },
  { name: 'Chronos', tag: 'Chronos', desc: 'Precision luxury watches and timepieces' },
  { name: 'ErgoDynamic', tag: 'ErgoDynamic', desc: 'Ergonomic office workstations and seating' },
  { name: 'Vanguard EDC', tag: 'Vanguard EDC', desc: 'Everyday carry gear, tactical accessories, and wallets' },
  { name: 'CraftHimalaya', tag: 'CraftHimalaya', desc: 'Artisan handmade singing bowls and cultural heritage crafts' },
  { name: 'SummitGear', tag: 'SummitGear', desc: 'Mountaineering backpacks and extreme weather outdoor gear' },
  { name: 'AlpineMerino', tag: 'AlpineMerino', desc: 'High-grade 100% Himalayan organic merino wool apparel' },
  { name: 'Himalaya Herbals', tag: 'Himalaya Herbals', desc: 'Ayurvedic wellness, pure skincare, and herbal extracts' },
  { name: 'Kama Botanicals', tag: 'Kama Botanicals', desc: 'Luxury organic botanical oils and natural beauty care' },
];

export const BrandManagement: React.FC<BrandManagementProps> = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [customBrands, setCustomBrands] = useState<Array<{ name: string; tag: string; description?: string; website?: string; isActive: boolean }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    description: '',
    website: '',
    isActive: true,
  });

  // Load existing products from backend to aggregate and sync brands
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await ecommerceService.getProducts({ limit: 100 });
      if (res.success && res.data) {
        const prodList = res.data.products || res.data || [];
        setProducts(Array.isArray(prodList) ? prodList : []);
      }
    } catch {
      showToast('Notice: Using local brand database', 'info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Load custom added brands from local storage if any
    try {
      const saved = localStorage.getItem('ecommerce_custom_brands');
      if (saved) {
        setCustomBrands(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }
  }, []);

  const saveCustomBrands = (brands: typeof customBrands) => {
    setCustomBrands(brands);
    try {
      localStorage.setItem('ecommerce_custom_brands', JSON.stringify(brands));
    } catch {
      // Ignore
    }
  };

  // Compile unified brand dataset combining products, defaults, and custom entries
  const allBrands: BrandItem[] = useMemo(() => {
    const brandMap = new Map<string, BrandItem>();

    // 1. Seed defaults
    INITIAL_POPULAR_BRANDS.forEach((b) => {
      brandMap.set(b.name.toLowerCase(), {
        id: b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: b.name,
        slug: b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        tag: b.tag,
        description: b.desc,
        productCount: 0,
        categories: [],
        isActive: true,
      });
    });

    // 2. Add or augment from customBrands
    customBrands.forEach((cb) => {
      const key = cb.name.toLowerCase();
      const existing = brandMap.get(key);
      brandMap.set(key, {
        id: key.replace(/[^a-z0-9]+/g, '-'),
        name: cb.name,
        slug: key.replace(/[^a-z0-9]+/g, '-'),
        tag: cb.tag || cb.name,
        description: cb.description || existing?.description || '',
        website: cb.website,
        productCount: existing?.productCount || 0,
        categories: existing?.categories || [],
        isActive: cb.isActive !== undefined ? cb.isActive : true,
      });
    });

    // 3. Count products associated with each brand (by p.brand or p.tags)
    products.forEach((p) => {
      const rawBrand = (p.brand || '').trim();
      if (rawBrand) {
        const key = rawBrand.toLowerCase();
        const existing = brandMap.get(key) || {
          id: key.replace(/[^a-z0-9]+/g, '-'),
          name: rawBrand,
          slug: key.replace(/[^a-z0-9]+/g, '-'),
          tag: rawBrand,
          description: `Registered brand with active store catalog inventory.`,
          productCount: 0,
          categories: [],
          isActive: true,
        };

        existing.productCount += 1;
        const catName = typeof p.category === 'object' && p.category?.name ? p.category.name : '';
        if (catName && !existing.categories.includes(catName)) {
          existing.categories.push(catName);
        }
        brandMap.set(key, existing);
      }

      // Also check if products are tagged by brand
      if (Array.isArray(p.tags)) {
        p.tags.forEach((tag) => {
          const key = tag.trim().toLowerCase();
          if (brandMap.has(key)) {
            const b = brandMap.get(key)!;
            if (rawBrand.toLowerCase() !== key) {
              b.productCount += 1;
            }
          }
        });
      }
    });

    return Array.from(brandMap.values());
  }, [products, customBrands]);

  // Filtering
  const filteredBrands = useMemo(() => {
    let result = allBrands;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.tag.toLowerCase().includes(q) ||
          (b.description && b.description.toLowerCase().includes(q))
      );
    }

    if (statusFilter === 'active') {
      result = result.filter((b) => b.isActive);
    } else if (statusFilter === 'inactive') {
      result = result.filter((b) => !b.isActive);
    }

    return result;
  }, [allBrands, searchQuery, statusFilter]);

  const openAddModal = () => {
    setEditingBrand(null);
    setFormData({
      name: '',
      tag: '',
      description: '',
      website: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (brand: BrandItem) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      tag: brand.tag,
      description: brand.description || '',
      website: brand.website || '',
      isActive: brand.isActive,
    });
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    const updated = { ...formData, name: val };
    if (!formData.tag || formData.tag === formData.name) {
      updated.tag = val;
    }
    setFormData(updated);
  };

  const handleSaveBrand = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = formData.name.trim();
    if (!cleanName) {
      showToast('Brand name is required', 'error');
      return;
    }

    const cleanTag = (formData.tag.trim() || cleanName).replace(/^#+/, '');
    const updatedList = customBrands.filter(
      (b) => b.name.toLowerCase() !== (editingBrand ? editingBrand.name.toLowerCase() : cleanName.toLowerCase())
    );

    updatedList.push({
      name: cleanName,
      tag: cleanTag,
      description: formData.description.trim(),
      website: formData.website.trim(),
      isActive: formData.isActive,
    });

    saveCustomBrands(updatedList);
    setIsModalOpen(false);
    showToast(editingBrand ? `Brand "${cleanName}" updated successfully` : `Brand "${cleanName}" added with tag #${cleanTag}`, 'success');
  };

  const handleDeleteBrand = (brandName: string) => {
    const updatedList = customBrands.filter((b) => b.name.toLowerCase() !== brandName.toLowerCase());
    saveCustomBrands(updatedList);
    showToast(`Brand "${brandName}" removed from custom list`, 'success');
  };

  return (
    <div className="w-full font-['Poppins','Inter',sans-serif] p-2 sm:p-4 space-y-3">
      {/* Breadcrumb Navigation */}
      <div className="px-1 flex items-center gap-1.5 text-[11px] leading-none text-slate-400">
        <Breadcrumb
          className="text-[11px] leading-none text-slate-400 [&_*]:border-0"
          items={[
            {
              title: (
                <Link to="/admin" className="text-slate-400 hover:text-[#0096C7] transition-colors">
                  Admin
                </Link>
              ),
            },
            {
              title: (
                <Link to="/admin/products" className="text-slate-400 hover:text-[#0096C7] transition-colors">
                  Products
                </Link>
              ),
            },
            {
              title: <span className="text-slate-600 font-medium">Brands</span>,
            },
          ]}
        />
      </div>

      {/* 2-Column Responsive Layout: Left Table + Right Sidebar for Controls & Counts (Matching User Annotation) */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        {/* Left Column: Main Brands Directory Card */}
        <div className="flex-1 min-w-0 w-full bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          {/* Table Top Controls */}
          <div className="px-4 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Brand & Tag Directory</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Manage product brands, assign searchable brand tags, and link catalog items.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search Input */}
              <div className="w-full sm:w-[240px] shrink-0">
                <AppInput
                  prefix={<SearchOutlined className="text-slate-400" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search brands or tags..."
                  allowClear
                />
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-[130px] shrink-0">
                <AppSelect
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val as string)}
                  options={[
                    { label: 'All Statuses', value: 'all' },
                    { label: 'Active', value: 'active' },
                    { label: 'Inactive', value: 'inactive' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Brands Table */}
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={6} />
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-lg">
                <TagOutlined />
              </div>
              <h4 className="text-sm font-bold text-slate-700">No brands found</h4>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or add a new brand.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <AppTable>
                <thead>
                  <tr>
                    <th className="py-2.5 px-6 font-medium text-[12px]">Brand & Identity</th>
                    <th className="py-2.5 px-4 font-medium text-[12px]">Brand Tag</th>
                    <th className="py-2.5 px-4 font-medium text-[12px]">Catalog Products</th>
                    <th className="py-2.5 px-4 font-medium text-[12px]">Departments</th>
                    <th className="py-2.5 px-4 font-medium text-[12px]">Status</th>
                    <th className="py-2.5 px-6 font-medium text-[12px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBrands.map((b) => {
                    const initial = b.name ? b.name.charAt(0).toUpperCase() : 'B';
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition-colors border-b border-slate-100">
                        {/* Brand & Identity */}
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-50 to-blue-100 border border-sky-200 text-[#0284c7] font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-slate-900 block truncate">{b.name}</span>
                              <span className="text-[10px] text-slate-400 truncate block max-w-[200px]">
                                {b.description || 'Verified manufacturer brand'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Brand Tag */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                            <TagOutlined className="text-[10px] text-amber-600" />
                            <span>#{b.tag}</span>
                          </span>
                        </td>

                        {/* Catalog Products */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">{b.productCount}</span>
                            <span className="text-[10px] text-slate-400">items</span>
                            {b.productCount > 0 && (
                              <button
                                type="button"
                                onClick={() => navigate(`/admin/products?search=${encodeURIComponent(b.name)}`)}
                                className="text-[10px] text-[#0284c7] hover:underline flex items-center gap-0.5 ml-1 font-semibold cursor-pointer"
                                title="Filter products by this brand"
                              >
                                <span>View</span>
                                <ArrowRightOutlined className="text-[8px]" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Departments */}
                        <td className="py-3 px-4">
                          {b.categories.length > 0 ? (
                            <div className="flex items-center gap-1 flex-wrap">
                              {b.categories.slice(0, 2).map((c) => (
                                <span key={c} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                  {c}
                                </span>
                              ))}
                              {b.categories.length > 2 && (
                                <span className="text-[10px] text-slate-400">+{b.categories.length - 2}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic">General Catalog</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <StatusBadge status={b.isActive ? 'active' : 'inactive'} />
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(b)}
                              className="p-1.5 text-slate-400 hover:text-[#0284c7] hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Brand"
                            >
                              <EditOutlined className="text-xs" />
                            </button>
                            <Popconfirm
                              title="Remove this brand?"
                              description="Are you sure you want to remove this brand entry?"
                              onConfirm={() => handleDeleteBrand(b.name)}
                              okText="Yes"
                              cancelText="No"
                            >
                              <button
                                type="button"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Brand"
                              >
                                <DeleteOutlined className="text-xs" />
                              </button>
                            </Popconfirm>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </AppTable>
            </div>
          )}
        </div>

        {/* Right Column: Actions & Vertical Metrics Panel (Matching User Annotation) */}
        <div className="w-full lg:w-80 shrink-0 space-y-3">
          {/* Primary Action Card: Add Brand */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-2.5">
            <AppButton
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddModal}
              className="w-full !h-10 text-xs font-bold shadow-xs flex items-center justify-center gap-2"
              style={{ backgroundColor: '#0096C7' }}
            >
              Add New Brand
            </AppButton>
            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Register a new brand and assign its searchable catalog product tag.
            </p>
          </div>

          {/* Vertical Metric Counts Panel */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 tracking-tight">Catalog Summary</span>
              <span className="text-[10px] font-bold text-[#0284c7] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                Live Metrics
              </span>
            </div>

            {/* Total Brands Count */}
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100/90 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Brands</span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">{allBrands.length}</span>
                <span className="text-[10px] text-slate-400">Available for catalog</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#0284c7] flex items-center justify-center text-lg shrink-0">
                <ShopOutlined />
              </div>
            </div>

            {/* Products Tagged Count */}
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100/90 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Products Tagged</span>
                <span className="text-xl font-black text-amber-600 mt-0.5 block">
                  {allBrands.reduce((acc, b) => acc + b.productCount, 0)}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">Active in store</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg shrink-0">
                <TagOutlined />
              </div>
            </div>

            {/* Active Brand Tags Count */}
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100/90 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Tags</span>
                <span className="text-xl font-black text-emerald-600 mt-0.5 block">
                  {allBrands.filter((b) => b.isActive).length}
                </span>
                <span className="text-[10px] text-slate-400">Ready for product tagging</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                <CheckCircleOutlined />
              </div>
            </div>
          </div>

          {/* Info & Tagging Shortcut Helper Card */}
          <div className="bg-gradient-to-br from-sky-50/80 to-blue-50/30 p-4 rounded-2xl border border-sky-100/80 shadow-xs space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-950">
              <InfoCircleOutlined className="text-[#0284c7]" />
              <span>How Brand Tags Work</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Assigning a brand automatically enables <strong>#BrandName</strong> product tags. Customers and admins can instantly filter products by clicking their brand tag.
            </p>
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="text-[11px] text-[#0284c7] font-bold hover:underline flex items-center gap-1 pt-1 cursor-pointer"
            >
              <span>Manage Products & Inventory</span>
              <ArrowRightOutlined className="text-[9px]" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Brand Modal */}
      <AppModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        title={editingBrand ? `Edit Brand: ${editingBrand.name}` : 'Add Brand & Tag'}
        onOk={handleSaveBrand}
        okText={editingBrand ? 'Save Changes' : 'Create Brand'}
      >
        <form onSubmit={handleSaveBrand} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Brand Name <span className="text-rose-500">*</span>
            </label>
            <AppInput
              placeholder="e.g. Himalaya Herbals, Apple, Nike"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Brand Tag (Searchable product tag) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">#</span>
              <input
                type="text"
                placeholder="Brand tag name"
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value.replace(/^#+/, '') })}
                className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0096C7] focus:border-[#0096C7] outline-none"
                required
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              This tag will be automatically available to tag any product by this brand.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description / Brand Story</label>
            <textarea
              rows={3}
              placeholder="Brief description about the brand, its origin, or product lines..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0096C7] focus:border-[#0096C7] outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Website URL (Optional)</label>
            <AppInput
              placeholder="https://brandname.com"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Brand Status</span>
              <span className="text-[10px] text-slate-400 block">Enable or disable brand for public tagging</span>
            </div>
            <Switch
              checked={formData.isActive}
              onChange={(checked) => setFormData({ ...formData, isActive: checked })}
              className="bg-slate-300"
            />
          </div>
        </form>
      </AppModal>
    </div>
  );
};

export default BrandManagement;
