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
  UploadOutlined,
  LoadingOutlined,
  LeftOutlined,
  RightOutlined,
  DownOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Popconfirm, Breadcrumb, Switch, Upload } from 'antd';
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
  {
    name: 'AeroPulse Audio',
    tag: 'AeroPulse Audio',
    desc: 'Premium wireless headphones and audiophile gear',
    logo: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Apex Tech',
    tag: 'Apex Tech',
    desc: 'High-performance computing and smart electronics',
    logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Chronos',
    tag: 'Chronos',
    desc: 'Precision luxury watches and timepieces',
    logo: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'ErgoDynamic',
    tag: 'ErgoDynamic',
    desc: 'Ergonomic office workstations and seating',
    logo: 'https://images.unsplash.com/photo-1580481077197-2868840d04b6?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Vanguard EDC',
    tag: 'Vanguard EDC',
    desc: 'Everyday carry gear, tactical accessories, and wallets',
    logo: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'CraftHimalaya',
    tag: 'CraftHimalaya',
    desc: 'Artisan handmade singing bowls and cultural heritage crafts',
    logo: 'https://images.unsplash.com/photo-1617791160505-6f00b51616ec?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'SummitGear',
    tag: 'SummitGear',
    desc: 'Mountaineering backpacks and extreme weather outdoor gear',
    logo: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'AlpineMerino',
    tag: 'AlpineMerino',
    desc: 'High-grade 100% Himalayan organic merino wool apparel',
    logo: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Himalaya Herbals',
    tag: 'Himalaya Herbals',
    desc: 'Ayurvedic wellness, pure skincare, and herbal extracts',
    logo: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Kama Botanicals',
    tag: 'Kama Botanicals',
    desc: 'Luxury organic botanical oils and natural beauty care',
    logo: 'https://images.unsplash.com/photo-1608248597359-579898c6978d?auto=format&fit=crop&w=200&q=80',
  },
];

export const BrandManagement: React.FC<BrandManagementProps> = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [customBrands, setCustomBrands] = useState<
    Array<{ name: string; tag: string; description?: string; website?: string; logo?: string; isActive: boolean }>
  >([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // View Mode: 'grid' (Modern Showcase Cards) or 'table' (Data Table)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    description: '',
    website: '',
    logo: '',
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

    // 1. Seed defaults with images
    INITIAL_POPULAR_BRANDS.forEach((b) => {
      brandMap.set(b.name.toLowerCase(), {
        id: b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: b.name,
        slug: b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        tag: b.tag,
        description: b.desc,
        logo: b.logo,
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
        logo: cb.logo || existing?.logo || '',
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

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredBrands.length / pageSize));
  const paginatedBrands = useMemo(() => {
    return filteredBrands.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredBrands, currentPage, pageSize]);

  const openAddModal = () => {
    setEditingBrand(null);
    setFormData({
      name: '',
      tag: '',
      description: '',
      website: '',
      logo: '',
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
      logo: brand.logo || '',
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

  // Ant Design Image Upload integration (Cloudinary with local fallback)
  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const res = await ecommerceService.uploadImage(file, 'HimalayaOnlineShop');
      if (res.success && res.data?.url) {
        setFormData((prev) => ({ ...prev, logo: res.data.url }));
        showToast('Brand logo uploaded successfully', 'success');
        return false;
      }
    } catch {
      const localUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, logo: localUrl }));
      showToast('Brand logo attached', 'success');
    } finally {
      setUploadingImage(false);
    }
    return false;
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
      logo: formData.logo,
      isActive: formData.isActive,
    });

    saveCustomBrands(updatedList);
    setIsModalOpen(false);
    showToast(
      editingBrand
        ? `Brand "${cleanName}" updated successfully`
        : `Brand "${cleanName}" created with tag #${cleanTag}`,
      'success'
    );
  };

  const handleDeleteBrand = (brandName: string) => {
    const updatedList = customBrands.filter((b) => b.name.toLowerCase() !== brandName.toLowerCase());
    saveCustomBrands(updatedList);
    showToast(`Brand "${brandName}" removed from custom list`, 'success');
  };

  return (
    <div className="w-full font-['Poppins','Inter',sans-serif] p-2 sm:p-4 space-y-3.5">
      {/* Top Bar: Breadcrumb + Embedded KPI Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
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

        {/* Quick KPI Stat Chips */}
        <div className="flex items-center gap-2 text-xs">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-200/80 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#0096C7]"></span>
            <span className="text-[11px] text-slate-500 font-medium">Brands:</span>
            <strong className="text-[11px] text-slate-900">{allBrands.length}</strong>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-200/80 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-[11px] text-slate-500 font-medium">Catalog Items:</span>
            <strong className="text-[11px] text-amber-600">{allBrands.reduce((acc, b) => acc + b.productCount, 0)}</strong>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-200/80 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] text-slate-500 font-medium">Active Tags:</span>
            <strong className="text-[11px] text-emerald-600">{allBrands.filter((b) => b.isActive).length}</strong>
          </div>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Header Toolbar: Title + Search + Filters + View Toggle + Add Button */}
        <div className="px-4 py-3.5 border-b border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Brand & Tag Showcase</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-50 text-[#0096C7] border border-sky-100 uppercase">
                {viewMode === 'grid' ? 'Visual Cards' : 'Data Table'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Browse brand identities, assign searchable product tags, and explore catalog links.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="w-full sm:w-[220px] shrink-0">
              <AppInput
                prefix={<SearchOutlined className="text-slate-400" />}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search brands or tags..."
                allowClear
              />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-[130px] shrink-0">
              <AppSelect
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val as string);
                  setCurrentPage(1);
                }}
                options={[
                  { label: 'All Statuses', value: 'all' },
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                ]}
              />
            </div>

            {/* View Mode Toggle: Grid Cards vs Table */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#0096C7] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Visual Cards View"
              >
                <AppstoreOutlined />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-[#0096C7] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Data Table View"
              >
                <UnorderedListOutlined />
                <span>Table</span>
              </button>
            </div>

            {/* Primary Add Brand Action */}
            <AppButton
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddModal}
              className="shrink-0"
              style={{ backgroundColor: '#0096C7' }}
            >
              Add Brand
            </AppButton>
          </div>
        </div>

        {/* Content Section: Render based on viewMode */}
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
        ) : viewMode === 'grid' ? (
          /* =========================================================================
             VIEW 1: Visual Brand Cards Showcase (Modern, Shopify / Linear style)
             ========================================================================= */
          <div className="p-4 bg-slate-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {paginatedBrands.map((b) => {
                const initial = b.name ? b.name.charAt(0).toUpperCase() : 'B';
                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-2xl border border-slate-200/80 hover:border-sky-300 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group space-y-3"
                  >
                    <div className="space-y-2.5">
                      {/* Top: Logo, Name & Status */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          {b.logo ? (
                            <img
                              src={b.logo}
                              alt={b.name}
                              className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shadow-2xs shrink-0 bg-white p-0.5"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-50 to-blue-100 border border-sky-200 text-[#0284c7] font-bold text-base flex items-center justify-center shrink-0 shadow-2xs">
                              {initial}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 truncate tracking-tight">{b.name}</h4>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mt-1 border border-amber-200 shadow-2xs truncate">
                              <TagOutlined className="text-[9px] text-amber-600" />
                              <span>#{b.tag}</span>
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={b.isActive ? 'active' : 'inactive'} />
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 min-h-[32px]">
                        {b.description || 'Verified manufacturer brand with live catalog items.'}
                      </p>

                      {/* Department Tags */}
                      {b.categories.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          {b.categories.slice(0, 2).map((c) => (
                            <span key={c} className="text-[9px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-100">
                              {c}
                            </span>
                          ))}
                          {b.categories.length > 2 && (
                            <span className="text-[9px] text-slate-400 font-semibold">+{b.categories.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Products Count & Actions */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 text-xs">{b.productCount}</span>
                        <span className="text-[10px] text-slate-400">Products</span>
                        {b.productCount > 0 && (
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/products?search=${encodeURIComponent(b.name)}`)}
                            className="text-[10px] text-[#0096C7] font-bold hover:underline flex items-center gap-0.5 ml-1 cursor-pointer"
                            title="View products in catalog"
                          >
                            <span>View</span>
                            <ArrowRightOutlined className="text-[8px]" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(b)}
                          className="p-1.5 text-slate-400 hover:text-[#0096C7] hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
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
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* =========================================================================
             VIEW 2: Classic Data Table
             ========================================================================= */
          <div className="overflow-x-auto">
            <AppTable>
              <thead>
                <tr>
                  <th className="py-2.5 px-6 font-medium text-[12px]">Brand & Logo</th>
                  <th className="py-2.5 px-4 font-medium text-[12px]">Brand Tag</th>
                  <th className="py-2.5 px-4 font-medium text-[12px]">Catalog Products</th>
                  <th className="py-2.5 px-4 font-medium text-[12px]">Departments</th>
                  <th className="py-2.5 px-4 font-medium text-[12px]">Status</th>
                  <th className="py-2.5 px-6 font-medium text-[12px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBrands.map((b) => {
                  const initial = b.name ? b.name.charAt(0).toUpperCase() : 'B';
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors border-b border-slate-100">
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          {b.logo ? (
                            <img
                              src={b.logo}
                              alt={b.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200/90 bg-white shadow-2xs shrink-0 p-0.5"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-50 to-blue-100 border border-sky-200 text-[#0284c7] font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                              {initial}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-900 block truncate">{b.name}</span>
                            <span className="text-[10px] text-slate-400 truncate block max-w-[200px]">
                              {b.description || 'Verified manufacturer brand'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                          <TagOutlined className="text-[10px] text-amber-600" />
                          <span>#{b.tag}</span>
                        </span>
                      </td>

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

                      <td className="py-3 px-4">
                        <StatusBadge status={b.isActive ? 'active' : 'inactive'} />
                      </td>

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

        {/* Table Footer: Total Count on Left, Pagination Controls on Right */}
        <div className="px-6 h-[32px] min-h-[32px] bg-[#0096C7] text-white rounded-b-md flex items-center justify-between text-[11px] shadow-inner select-none">
          {/* Left Side: Brand Count */}
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-medium text-white/90 text-[11px] leading-none">Total Brands:</span>
            <span className="font-bold text-white text-[11px] leading-none">
              {filteredBrands.length} Brands
            </span>
          </div>

          {/* Right Side: Pagination Controls */}
          {filteredBrands.length > 0 && (
            <div className="flex items-center gap-2.5 leading-none">
              <div className="flex items-center gap-1 text-[10px] text-white/95 font-medium leading-none">
                <span>Items:</span>
                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="appearance-none bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-[10px] rounded pl-1.5 pr-4 py-0 outline-none cursor-pointer transition-colors focus:ring-1 focus:ring-white h-[20px] leading-none"
                  >
                    <option value={8} className="bg-slate-800 text-white">8</option>
                    <option value={12} className="bg-slate-800 text-white">12</option>
                    <option value={24} className="bg-slate-800 text-white">24</option>
                    <option value={48} className="bg-slate-800 text-white">48</option>
                  </select>
                  <DownOutlined className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[7px] text-white/80" />
                </div>
              </div>

              <span className="text-[10px] text-white/95 font-medium whitespace-nowrap leading-none">
                {filteredBrands.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
                {Math.min(currentPage * pageSize, filteredBrands.length)} of {filteredBrands.length}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="Previous page"
                  className="w-5 h-5 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 active:bg-white/30 disabled:opacity-30 disabled:hover:bg-white/15 disabled:cursor-not-allowed text-white transition-all cursor-pointer border border-white/20"
                >
                  <LeftOutlined className="text-[8px]" />
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Next page"
                  className="w-5 h-5 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 active:bg-white/30 disabled:opacity-30 disabled:hover:bg-white/15 disabled:cursor-not-allowed text-white transition-all cursor-pointer border border-white/20"
                >
                  <RightOutlined className="text-[8px]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Brand Modal using Ant Design Upload Component */}
      <AppModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        title={editingBrand ? `Edit Brand: ${editingBrand.name}` : 'Add Brand & Tag'}
        onOk={handleSaveBrand}
        okText={editingBrand ? 'Save Changes' : 'Create Brand'}
      >
        <form onSubmit={handleSaveBrand} className="space-y-4 pt-2">
          {/* Ant Design Image Upload Section */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Brand Logo / Icon
            </label>
            <div className="flex items-center gap-3.5 p-3 bg-slate-50 border border-slate-200/90 rounded-xl">
              <Upload
                name="brandLogo"
                listType="picture-card"
                className="brand-logo-uploader [&_.ant-upload]:!w-20 [&_.ant-upload]:!h-20 [&_.ant-upload]:!rounded-xl [&_.ant-upload]:!border-dashed [&_.ant-upload]:!border-slate-300 [&_.ant-upload]:!bg-white"
                showUploadList={false}
                beforeUpload={(file) => {
                  handleImageUpload(file);
                  return false;
                }}
                accept="image/*"
                disabled={uploadingImage}
              >
                {formData.logo ? (
                  <div className="relative group w-full h-full rounded-xl overflow-hidden">
                    <img
                      src={formData.logo}
                      alt="Brand logo"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/55 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-semibold">
                      <UploadOutlined className="text-sm mb-0.5" />
                      <span>Change</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 p-1">
                    {uploadingImage ? (
                      <>
                        <LoadingOutlined className="text-base text-[#0096C7] mb-1" spin />
                        <span className="text-[9px] text-slate-500 font-medium">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <PlusOutlined className="text-base text-slate-400 mb-0.5" />
                        <span className="text-[10px] text-slate-600 font-semibold">Upload</span>
                        <span className="text-[8px] text-slate-400">PNG / JPG</span>
                      </>
                    )}
                  </div>
                )}
              </Upload>

              <div className="flex-1 space-y-1 min-w-0">
                <span className="text-xs font-bold text-slate-800 block">
                  {formData.logo ? 'Brand Logo Attached' : 'Attach Official Logo'}
                </span>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Click the box to upload from your computer, or paste a direct logo image URL below.
                </p>
                {formData.logo && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, logo: '' }))}
                    className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer transition-colors block"
                  >
                    ✕ Remove Logo
                  </button>
                )}
              </div>
            </div>

            {/* Optional URL input for direct web images */}
            <div className="mt-1.5">
              <input
                type="text"
                placeholder="Or paste direct image URL (https://...)"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-1 focus:ring-[#0096C7] outline-none"
              />
            </div>
          </div>

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
