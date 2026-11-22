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
} from '@ant-design/icons';
import { Popconfirm, Breadcrumb, Switch, Upload, Dropdown } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { Product } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import {
  AppInput,
  AppSelect,
  AppModal,
  TableSkeleton,
  AppImageUpload,
  generateUniqueSlug,
  sanitizeSlug,
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

const BRAND_AVATAR_COLORS = [
  { bg: '#0096C7', text: '#ffffff' }, // Himalaya Cyan
  { bg: '#2563EB', text: '#ffffff' }, // Blue
  { bg: '#7C3AED', text: '#ffffff' }, // Purple
  { bg: '#D97706', text: '#ffffff' }, // Amber
  { bg: '#059669', text: '#ffffff' }, // Emerald
  { bg: '#DC2626', text: '#ffffff' }, // Red
  { bg: '#DB2777', text: '#ffffff' }, // Pink
  { bg: '#0891B2', text: '#ffffff' }, // Teal
  { bg: '#EA580C', text: '#ffffff' }, // Orange
  { bg: '#4F46E5', text: '#ffffff' }, // Indigo
];

export const getBrandColorByName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % BRAND_AVATAR_COLORS.length;
  return BRAND_AVATAR_COLORS[index];
};

export const getBrandInitialSvg = (name: string) => {
  const initial = name && name.trim() ? name.trim().charAt(0).toUpperCase() : 'B';
  const { bg, text } = getBrandColorByName(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
    <rect width="120" height="120" rx="28" fill="${bg}"/>
    <text x="60" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="54" font-weight="800" fill="${text}" text-anchor="middle" dominant-baseline="middle">${initial}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
    publicId: '',
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
      publicId: '',
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
      publicId: '',
      isActive: brand.isActive,
    });
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    const existingSlugs = allBrands.map((b) => b.tag);
    const ignoreSlug = editingBrand ? editingBrand.tag : undefined;
    const autoSlug = generateUniqueSlug(val, existingSlugs, ignoreSlug);

    setFormData((prev) => ({
      ...prev,
      name: val,
      tag: autoSlug,
    }));
  };

  const handleSlugChange = (val: string) => {
    // Sanitize manually entered slug: lowercase, space-free alphanumeric
    const clean = sanitizeSlug(val);
    setFormData((prev) => ({ ...prev, tag: clean }));
  };

  // Image Upload integration (Uploads to HimalayaOnlineShop/Temporary staging with unique ID)
  const handleImageUpload = async (file: File): Promise<string | void> => {
    setUploadingImage(true);
    try {
      const res = await ecommerceService.uploadImage(file, 'HimalayaOnlineShop/Temporary');
      if (res.success && res.data?.url) {
        setFormData((prev) => ({
          ...prev,
          logo: res.data.url,
          publicId: res.data.public_id,
        }));
        showToast('Image uploaded to temporary staging', 'success');
        return res.data.url;
      }
    } catch {
      const localUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, logo: localUrl }));
      showToast('Brand logo attached locally', 'success');
      return localUrl;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveBrand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = formData.name.trim();
    if (!cleanName) {
      showToast('Brand name is required', 'error');
      return;
    }

    let finalLogo = formData.logo.trim();

    // If an image was staged in HimalayaOnlineShop/Temporary, commit it to HimalayaOnlineShop/Admin/Brands
    if (
      formData.publicId &&
      (formData.publicId.includes('/Temporary/') || formData.publicId.startsWith('HimalayaOnlineShop/Temporary'))
    ) {
      try {
        const commitRes = await ecommerceService.commitImage(formData.publicId, 'Admin/Brands');
        if (commitRes.success && commitRes.data?.url) {
          finalLogo = commitRes.data.url;
        }
      } catch (err) {
        console.warn('Commit image notice:', err);
      }
    }

    const existingSlugs = allBrands.map((b) => b.tag);
    const ignoreSlug = editingBrand ? editingBrand.tag : undefined;
    const cleanTag = sanitizeSlug(formData.tag) || generateUniqueSlug(cleanName, existingSlugs, ignoreSlug);

    const updatedList = customBrands.filter(
      (b) => b.name.toLowerCase() !== (editingBrand ? editingBrand.name.toLowerCase() : cleanName.toLowerCase())
    );

    updatedList.push({
      name: cleanName,
      tag: cleanTag,
      description: formData.description.trim(),
      website: formData.website.trim(),
      logo: finalLogo || getBrandInitialSvg(cleanName),
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
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden font-['Poppins','Inter',sans-serif] space-y-2.5">
      {/* Top Bar: Breadcrumb */}
      <div className="shrink-0">
        <Breadcrumb
          className="text-[11px] leading-none text-slate-500 [&_*]:border-0 font-semibold"
          items={[
            {
              title: (
                <Link to="/admin" className="text-slate-500 hover:text-[#0096C7] transition-colors font-semibold">
                  Admin
                </Link>
              ),
            },
            {
              title: (
                <Link to="/admin/products" className="text-slate-500 hover:text-[#0096C7] transition-colors font-semibold">
                  Products
                </Link>
              ),
            },
            {
              title: <span className="text-slate-800 font-bold">Brands</span>,
            },
          ]}
        />
      </div>

      {/* Two-Column Responsive Layout: Left Table Directory + Right Summary & Actions (Independent Scroll) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row items-stretch gap-3 sm:gap-4 overflow-hidden">
        {/* Left Column: Brand & Tag Directory Table */}
        <div className="flex-1 min-w-0 h-full bg-white rounded-t-2xl rounded-b-[2px] shadow-xs overflow-hidden flex flex-col">
          {/* Header Toolbar: Title + Search + Status Filter */}
          <div className="px-4 py-3 flex items-center justify-between gap-3 bg-white shrink-0">
            <div className="shrink-0">
              <h3 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
                Brands
              </h3>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {/* Search Input */}
              <div className="w-full sm:w-[220px]">
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
              <div className="w-[130px] shrink-0">
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
            </div>
          </div>

          {/* Content Section: Data Table (Independent Scroll Area) */}
          {loading ? (
            <div className="p-6 flex-1 min-h-0 overflow-y-auto">
              <TableSkeleton rows={6} />
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="p-12 text-center flex-1 min-h-0 overflow-y-auto">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-lg">
                <TagOutlined />
              </div>
              <h4 className="text-sm font-bold text-slate-700">No brands found</h4>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or add a new brand.</p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto brand-table-scroll relative">
              <table className="kiran-role-table app-table w-full border-collapse">
                <thead className="sticky top-0 z-20 shadow-xs">
                  <tr className="bg-[#0096C7]">
                    <th className="sticky top-0 z-20 !bg-[#0096C7] !text-white py-2.5 px-4 font-semibold text-[12px] whitespace-nowrap shadow-xs">
                      Brand & Logo
                    </th>
                    <th className="sticky top-0 z-20 !bg-[#0096C7] !text-white py-2.5 px-4 font-semibold text-[12px] whitespace-nowrap shadow-xs">
                      Brand Tag
                    </th>
                    <th className="sticky top-0 z-20 !bg-[#0096C7] !text-white py-2.5 px-4 font-semibold text-[12px] whitespace-nowrap shadow-xs">
                      Catalog Products
                    </th>
                    <th className="sticky top-0 z-20 !bg-[#0096C7] !text-white py-2.5 px-4 font-semibold text-[12px] whitespace-nowrap shadow-xs">
                      Departments
                    </th>
                    <th className="sticky top-0 z-20 !bg-[#0096C7] !text-white py-2.5 px-4 font-semibold text-[12px] whitespace-nowrap shadow-xs">
                      Status
                    </th>
                    <th className="sticky top-0 z-20 !bg-[#0096C7] !text-white py-2.5 px-4 font-semibold text-[12px] text-right whitespace-nowrap shadow-xs">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                {paginatedBrands.map((b) => {
                  const initial = b.name ? b.name.charAt(0).toUpperCase() : 'B';
                  const brandColor = getBrandColorByName(b.name);
                  const initialSvg = getBrandInitialSvg(b.name);
                  const logoUrl = b.logo && b.logo.trim() ? b.logo.trim() : initialSvg;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={logoUrl}
                            alt={b.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200/90 bg-white shadow-2xs shrink-0 p-0.5"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src !== initialSvg) {
                                target.src = initialSvg;
                              }
                            }}
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-[13px] text-slate-900 block truncate">{b.name}</span>
                            <span className="text-[11px] text-slate-700 font-medium truncate block max-w-[220px]">
                              {b.description || 'Verified manufacturer brand'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
                          <span
                            className="w-4 h-4 rounded-full text-white font-black text-[9px] flex items-center justify-center shrink-0 shadow-2xs leading-none"
                            style={{ backgroundColor: brandColor.bg }}
                          >
                            {initial}
                          </span>
                          <span>#{b.tag}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{b.productCount}</span>
                          <span className="text-xs text-slate-700 font-semibold">items</span>
                          {b.productCount > 0 && (
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/products?search=${encodeURIComponent(b.name)}`)}
                              className="text-[10px] text-[#0096C7] hover:underline flex items-center gap-0.5 ml-1 font-bold cursor-pointer"
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
                              <span key={c} className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                                {c}
                              </span>
                            ))}
                            {b.categories.length > 2 && (
                              <span className="text-[11px] text-slate-700 font-bold">+{b.categories.length - 2}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-700 font-medium">General Catalog</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`text-xs font-bold ${b.isActive ? 'text-emerald-700' : 'text-slate-600'}`}>
                          {b.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(b)}
                            className="p-1.5 text-slate-600 hover:text-[#0096C7] hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Brand"
                          >
                            <EditOutlined className="text-sm" />
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
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Brand"
                            >
                              <DeleteOutlined className="text-sm" />
                            </button>
                          </Popconfirm>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer: Total Count on Left, Pagination Controls on Right */}
        <div className="px-4 h-[32px] min-h-[32px] max-h-[32px] bg-[#0096C7] text-white rounded-b-[2px] flex items-center justify-between text-[11px] shadow-inner select-none mt-auto overflow-hidden">
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
              <div className="flex items-center gap-1.5 text-[10px] text-white/95 font-medium leading-none">
                <span>Items:</span>
                <Dropdown
                  menu={{
                    items: [
                      { key: '10', label: <span className="font-semibold text-xs text-slate-800">10 / page</span> },
                      { key: '20', label: <span className="font-semibold text-xs text-slate-800">20 / page</span> },
                      { key: '50', label: <span className="font-semibold text-xs text-slate-800">50 / page</span> },
                    ],
                    selectedKeys: [String(pageSize)],
                    onClick: ({ key }) => {
                      setPageSize(Number(key));
                      setCurrentPage(1);
                    },
                  }}
                  trigger={['click']}
                  placement="topRight"
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 active:bg-white/40 border border-white/35 text-white font-bold text-[10px] rounded px-1.5 h-[20px] outline-none cursor-pointer transition-all leading-none"
                    title="Change page size"
                  >
                    <span>{pageSize}</span>
                    <DownOutlined className="text-[7px] text-white/85" />
                  </button>
                </Dropdown>
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
                  className="!w-5 !h-5 !min-w-0 !min-h-0 p-0 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 active:bg-white/30 disabled:opacity-30 disabled:hover:bg-white/15 disabled:cursor-not-allowed text-white transition-all cursor-pointer border border-white/20 leading-none"
                >
                  <LeftOutlined className="text-[8px]" />
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Next page"
                  className="!w-5 !h-5 !min-w-0 !min-h-0 p-0 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 active:bg-white/30 disabled:opacity-30 disabled:hover:bg-white/15 disabled:cursor-not-allowed text-white transition-all cursor-pointer border border-white/20 leading-none"
                >
                  <RightOutlined className="text-[8px]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Right Column: Add Brand Card + Catalog Summary Metrics (Independent Scroll Area) */}
        <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 h-full overflow-y-auto brand-sidebar-scroll space-y-3.5 pr-1">
          {/* Card 1: Add New Brand (Height matched with Search & Status, no description) */}
          <div className="bg-white rounded-2xl shadow-xs px-4 py-3 flex items-center">
            <button
              type="button"
              onClick={openAddModal}
              className="w-full h-[32px] flex items-center justify-center gap-1.5 bg-[#0096C7] hover:bg-[#0083ae] active:bg-[#007096] text-white font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <PlusOutlined className="text-xs" />
              <span>Add New Brand</span>
            </button>
          </div>

          {/* Card 2: Catalog Summary (Static Clean View) */}
          <div className="bg-white rounded-2xl shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h4 className="text-xs font-bold text-slate-900">Catalog Summary</h4>
              <span className="text-[10px] font-bold text-[#0096C7] bg-sky-50 px-2.5 py-0.5 rounded-full">
                Live Metrics
              </span>
            </div>

            <div className="space-y-1">
              {/* Metric 1: Total Brands */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Total Brands
                  </span>
                  <span className="text-2xl font-black text-slate-900 leading-tight block">
                    {allBrands.length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Available for catalog
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0096C7] flex items-center justify-center text-lg shrink-0">
                  <ShopOutlined />
                </div>
              </div>

              {/* Metric 2: Products Tagged */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Products Tagged
                  </span>
                  <span className="text-2xl font-black text-amber-600 leading-tight block">
                    {allBrands.reduce((acc, b) => acc + b.productCount, 0)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Active in store
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg shrink-0">
                  <TagOutlined />
                </div>
              </div>

              {/* Metric 3: Active Tags */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Active Tags
                  </span>
                  <span className="text-2xl font-black text-emerald-600 leading-tight block">
                    {allBrands.filter((b) => b.isActive).length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Ready for product tagging
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                  <CheckCircleOutlined />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Brand Modal - Wider width, no inline scroll */}
      <AppModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        title={editingBrand ? `Edit Brand: ${editingBrand.name}` : 'Add Brand & Tag'}
        onOk={handleSaveBrand}
        okText={editingBrand ? 'Save Changes' : 'Create Brand'}
        width={700}
      >
        <form onSubmit={handleSaveBrand} className="space-y-3.5 pt-1">
          {/* Row 1: Brand Name & Brand Slug Name (Side by Side) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Brand Name <span className="text-rose-500">*</span>
              </label>
              <AppInput
                placeholder="e.g. AeroPulse Audio"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Brand Slug Name <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-slate-400 font-normal">Auto-generated for routing</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">/</span>
                <input
                  type="text"
                  placeholder="e.g. sonypsp"
                  value={formData.tag}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="w-full pl-6 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-[#0096C7] focus:border-[#0096C7] outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Row 2: Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Brief description about the brand, product line, or origin..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-[#0096C7] focus:border-[#0096C7] outline-none resize-none"
            />
          </div>

          {/* Row 3: Image Upload (Picture-Card style) */}
          <AppImageUpload
            label="Image"
            value={formData.logo}
            onChange={(url) => setFormData((prev) => ({ ...prev, logo: url }))}
            onUpload={handleImageUpload}
            loading={uploadingImage}
            fallbackInitial={formData.name ? formData.name.charAt(0) : undefined}
          />

          {/* Row 4: Status */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Status</span>
              <span className="text-[10px] text-slate-400 block">Enable or disable brand for public catalog tagging</span>
            </div>
            <Switch
              checked={formData.isActive}
              onChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>
        </form>
      </AppModal>
    </div>
  );
};

export default BrandManagement;
