import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
  StarFilled,
  WarningOutlined,
  DownOutlined,
  LeftOutlined,
  RightOutlined,
  UploadOutlined,
  LoadingOutlined,
  PictureOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';
import { Tag, Checkbox, Spin, Popconfirm, Breadcrumb, Upload, Dropdown, Tooltip } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { Product, Category } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from 'auth-client/hooks/useAuth';
import { usePermissions } from '../../../context/PermissionContext';
import { ProductQrModal } from './ProductQrModal';
import {
  AppTable,
  AppButton,
  AppInput,
  AppSelect,
  AppModal,
  DeleteConfirmModal,
  StatusBadge,
  TableSkeleton,
} from 'shared-components';

export const ProductManagement: React.FC = () => {
  const { user } = useAuth();
  const isSeller = user?.role === 'seller';
  const isAdmin = user?.role === 'admin';
  const { can } = usePermissions();

  const canCreate = can('create', 'products');
  const canEdit = can('edit', 'products');
  const canDelete = can('delete', 'products');
  const canAdjustStock = can('edit', 'inventory') || can('edit', 'products');

  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const POPULAR_BRANDS = [
    'AeroPulse Audio',
    'Apex Tech',
    'Chronos',
    'ErgoDynamic',
    'Vanguard EDC',
    'CraftHimalaya',
    'SummitGear',
    'AlpineMerino',
    'Himalaya Herbals',
    'Kama Botanicals',
  ];

  const allAvailableBrands = useMemo(() => {
    const fromProducts = products.map((p) => (p.brand || '').trim()).filter(Boolean) as string[];
    const set = new Set<string>([...POPULAR_BRANDS, ...fromProducts]);
    return Array.from(set).sort();
  }, [products]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    brand: '',
    category: '',
    price: '',
    salePrice: '',
    stock: '',
    description: '',
    shortDescription: '',
    image: '',
    isFeatured: false,
    status: 'active',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const PRESET_TAGS = [
    'Oily Skin',
    'Fair Skin',
    'Dry Skin',
    'Sensitive Skin',
    'Acne-Prone',
    'Anti-Aging',
    'Organic',
    'Cruelty-Free',
    'Vegan',
    'Hydrating',
    'Handmade',
    'Best Seller',
  ];

  const handleAddTag = (tagToAdd?: string) => {
    const rawTag = (tagToAdd !== undefined ? tagToAdd : tagInput).trim();
    if (!rawTag) return;
    if (!formData.tags.some((t) => t.toLowerCase() === rawTag.toLowerCase())) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, rawTag] }));
    }
    if (tagToAdd === undefined) {
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const handleTogglePresetTag = (preset: string) => {
    if (formData.tags.some((t) => t.toLowerCase() === preset.toLowerCase())) {
      handleRemoveTag(preset);
    } else {
      handleAddTag(preset);
    }
  };

  const { showToast } = useToast();

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const res = await ecommerceService.uploadImage(file, 'HimalayaOnlineShop');
      if (res.success && res.data?.url) {
        setFormData((prev) => ({ ...prev, image: res.data.url }));
        showToast('Image uploaded to Cloudinary successfully', 'success');
      } else {
        showToast(res.messages?.[0] || 'Image upload failed', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to upload image to Cloudinary', 'error');
    } finally {
      setUploadingImage(false);
    }
    return false;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        ecommerceService.getProducts({
          search: searchQuery,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          brand: selectedBrand !== 'all' ? selectedBrand : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          limit: 100,
        }),
        ecommerceService.getCategories(),
      ]);

      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data.products);
      }
      if (catRes.success && catRes.data) {
        setCategories(catRes.data);
      }
    } catch {
      showToast('Error loading products list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedBrand, statusFilter]);

  useEffect(() => {
    const brandParam = searchParams.get('brand');
    if (brandParam) {
      setSelectedBrand(brandParam);
    }
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
    if (searchParams.get('action') === 'new') {
      openAddModal();
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const openAddModal = () => {
    if (!canCreate) {
      showToast('Permission denied: You do not have permission to add products', 'error');
      return;
    }
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      brand: '',
      category: categories[0]?._id || categories[0]?.id || '',
      price: '',
      salePrice: '',
      stock: '25',
      description: '',
      shortDescription: '',
      image: '',
      isFeatured: false,
      status: 'active',
      tags: [],
    });
    setTagInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    if (!canEdit) {
      showToast('Permission denied: You do not have permission to edit products', 'error');
      return;
    }
    setEditingProduct(product);
    const catId = typeof product.category === 'object' ? (product.category._id || product.category.id) : product.category;
    setFormData({
      name: product.name,
      sku: product.sku,
      brand: product.brand || '',
      category: catId || '',
      price: product.price.toString(),
      salePrice: product.salePrice ? product.salePrice.toString() : '',
      stock: product.stock.toString(),
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      image: product.images?.[0] || '',
      isFeatured: product.isFeatured || false,
      status: product.status || 'active',
      tags: product.tags || [],
    });
    setTagInput('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || !formData.price || !formData.stock) {
      showToast('Please fill out all required product fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name: formData.name,
        sku: formData.sku.toUpperCase(),
        brand: formData.brand.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
        stock: parseInt(formData.stock, 10),
        description: formData.description,
        shortDescription: formData.shortDescription,
        images: formData.image ? [formData.image] : [],
        isFeatured: formData.isFeatured,
        status: formData.status,
        tags: formData.tags,
      };

      if (editingProduct) {
        const prodId = editingProduct._id || editingProduct.id;
        const res = await ecommerceService.updateProduct(prodId!, payload);
        if (res.success) {
          showToast('Product updated successfully', 'success');
          setIsModalOpen(false);
          loadData();
        }
      } else {
        const res = await ecommerceService.createProduct(payload);
        if (res.success) {
          showToast('Product created successfully', 'success');
          setIsModalOpen(false);
          loadData();
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Error saving product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    const pId = productToDelete._id || productToDelete.id;
    if (!pId) return;
    if (!canDelete) {
      showToast('Permission denied: You do not have permission to delete products', 'error');
      return;
    }
    setDeleting(true);
    try {
      const res = await ecommerceService.deleteProduct(pId);
      if (res.success) {
        showToast(`Product "${productToDelete.name}" was successfully deleted`, 'success');
        setProducts((prev) => prev.filter((p) => (p._id || p.id) !== pId));
        setProductToDelete(null);
      } else {
        showToast(res.messages?.[0] || 'Failed to delete product', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to delete product', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleStockAdjust = async (product: Product, delta: number) => {
    if (!canAdjustStock) {
      showToast('Permission denied: You do not have permission to adjust inventory', 'error');
      return;
    }
    const newStock = Math.max(0, product.stock + delta);
    const prodId = product._id || product.id;
    try {
      const res = await ecommerceService.updateStock(prodId!, newStock);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => ((p._id || p.id) === prodId ? { ...p, stock: newStock } : p))
        );
        showToast(`Stock updated to ${newStock}`, 'success');
      }
    } catch {
      showToast('Failed to adjust stock', 'error');
    }
  };

  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const paginatedProducts = products.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
                  {isSeller ? 'Seller' : 'Admin'}
                </Link>
              ),
            },
            {
              title: <span className="text-slate-800 font-bold">Products</span>,
            },
          ]}
        />
      </div>

      {/* Two-Column Responsive Layout: Left Table Directory + Right Summary & Actions (Independent Scroll) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row items-stretch gap-3 sm:gap-4 overflow-hidden">
        {/* Left Column: Products Directory Table */}
        <div className="flex-1 min-w-0 h-full bg-white rounded-t-2xl rounded-b-[2px] shadow-xs overflow-hidden flex flex-col">
          {/* Header Toolbar: Title + Search + Filters */}
          <div className="pl-0 pr-4 py-3 flex items-center justify-between gap-3 bg-white shrink-0">
            <div className="shrink-0">
              <h3 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
                {isSeller ? 'My Products & Inventory' : 'Products & Inventory'}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {/* Search Input */}
              <form onSubmit={handleSearchSubmit} className="w-full sm:w-[200px]">
                <AppInput
                  prefix={<SearchOutlined className="text-slate-400" />}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search products..."
                  allowClear
                />
              </form>

              {/* Department Dropdown */}
              <div className="w-full sm:w-[130px] shrink-0">
                <AppSelect
                  value={selectedCategory}
                  onChange={(val) => {
                    setSelectedCategory(val as string);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: 'All Depts', value: 'all' },
                    ...categories.map((c) => ({
                      label: c.name,
                      value: c._id || c.id || '',
                    })),
                  ]}
                />
              </div>

              {/* Brand Filter Dropdown */}
              <div className="w-full sm:w-[120px] shrink-0">
                <AppSelect
                  value={selectedBrand}
                  onChange={(val) => {
                    setSelectedBrand(val as string);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: 'All Brands', value: 'all' },
                    ...allAvailableBrands.map((b) => ({
                      label: b,
                      value: b,
                    })),
                  ]}
                />
              </div>

              {/* Status Dropdown */}
              <div className="w-full sm:w-[110px] shrink-0">
                <AppSelect
                  value={statusFilter}
                  onChange={(val) => {
                    setStatusFilter(val as string);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: 'All Status', value: 'all' },
                    { label: 'Active', value: 'active' },
                    { label: 'Draft', value: 'draft' },
                    { label: 'Archived', value: 'archived' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Content Section: Data Table (Independent Scroll Area) */}
          {loading ? (
            <div className="p-6 flex-1 min-h-0 overflow-y-auto">
              <TableSkeleton columns={6} rows={6} hasAvatar={true} />
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center flex-1 min-h-0 overflow-y-auto">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-lg">
                <ShoppingOutlined />
              </div>
              <h4 className="text-sm font-bold text-slate-700">No products found</h4>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or add a new product.</p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto brand-table-scroll relative">
              <table className="kiran-role-table app-table w-full border-collapse">
                <thead className="sticky top-0 z-20 shadow-xs">
                  <tr className="bg-[#0096C7]">
                    <th className="sticky top-0 z-20 !bg-[#0096C7] !text-white py-2.5 px-4 font-semibold text-[12px] whitespace-nowrap shadow-xs">
                      Product & SKU
                    </th>
                    <th className="sticky top-0 z-20 !bg-[#0096C7] !text-white py-2.5 px-4 font-semibold text-[12px] whitespace-nowrap shadow-xs">
                      Department
                    </th>
                    <th className="sticky top-0 z-20 !bg-[#0096C7] !text-white py-2.5 px-4 font-semibold text-[12px] whitespace-nowrap shadow-xs">
                      Price
                    </th>
                    <th className="sticky top-0 z-20 !bg-[#0096C7] !text-white py-2.5 px-4 font-semibold text-[12px] whitespace-nowrap shadow-xs">
                      Stock Units
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
                  {paginatedProducts.map((p) => {
                    const pId = p._id || p.id || '';
                    const categoryName = typeof p.category === 'object' ? p.category.name : 'General';
                    const isLow = p.stock <= 5;
                    const isOut = p.stock === 0;

                    return (
                      <tr key={pId} className="hover:bg-sky-50/40 transition-colors group cursor-default">
                        {/* Product & SKU */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                            />
                            <div className="max-w-[240px]">
                              <div className="font-bold text-slate-900 text-xs truncate flex items-center gap-1.5">
                                {p.name}
                                {p.isFeatured && (
                                  <StarFilled className="text-amber-400 text-xs" title="Featured Item" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-slate-400 font-mono">
                                  SKU: {p.sku || 'N/A'}
                                </span>
                                {p.brand && (
                                  <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-100 uppercase tracking-wider">
                                    {p.brand}
                                  </span>
                                )}
                              </div>
                              {p.tags && p.tags.length > 0 && (
                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                  {p.tags.slice(0, 3).map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full font-medium"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                  {p.tags.length > 3 && (
                                    <span className="text-[9px] text-slate-400 font-medium">
                                      +{p.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Tag className="m-0 font-semibold text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 border-slate-200 text-slate-700">
                            {categoryName}
                          </Tag>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 text-xs">
                            ${p.salePrice ? p.salePrice.toFixed(2) : p.price.toFixed(2)}
                          </div>
                          {p.salePrice && (
                            <div className="text-[11px] text-slate-400 line-through">
                              ${p.price.toFixed(2)}
                            </div>
                          )}
                        </td>

                        {/* Stock Units */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Tag
                              color={isOut ? 'error' : isLow ? 'warning' : 'success'}
                              className="m-0 font-bold text-[11px] px-2.5 py-0.5 rounded-full"
                            >
                              {p.stock} units
                            </Tag>
                            {canAdjustStock && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleStockAdjust(p, -1)}
                                  className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs flex items-center justify-center font-bold cursor-pointer"
                                  title="Decrease 1"
                                >
                                  -
                                </button>
                                <button
                                  onClick={() => handleStockAdjust(p, +5)}
                                  className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs flex items-center justify-center font-bold cursor-pointer"
                                  title="Add 5"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <StatusBadge status={p.status} />
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Tooltip title="View Product QR Code">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQrProduct(p);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-[#0096C7] hover:border-[#0096C7] hover:bg-sky-50 transition-colors cursor-pointer"
                              >
                                <QrcodeOutlined className="text-xs" />
                              </button>
                            </Tooltip>
                            {canEdit && (
                              <AppButton
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => openEditModal(p)}
                                title="Edit Product"
                              />
                            )}
                            {canDelete && (
                              <AppButton
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => setProductToDelete(p)}
                                title="Delete Product"
                              />
                            )}
                            {!canEdit && !canDelete && (
                              <span className="text-[10px] text-slate-400 font-mono italic">Read-only</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer (Compact cyan toolbar with AntD Dropdown) */}
          <div className="bg-[#0096C7] px-4 py-1.5 flex items-center justify-between shrink-0 shadow-inner rounded-b-[2px] select-none h-[32px]">
            {/* Left Side: Page Size Selector via AntD Dropdown */}
            <div className="flex items-center gap-1.5 text-[10px] text-white/90 font-medium">
              <span>Showing</span>
              <Dropdown
                menu={{
                  items: [
                    { key: '10', label: '10 / page' },
                    { key: '20', label: '20 / page' },
                    { key: '50', label: '50 / page' },
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
              {products.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min(currentPage * pageSize, products.length)} of {products.length}
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
        </div>

        {/* Right Column: Add Product Card + Catalog Summary Metrics (Independent Scroll Area) */}
        <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 h-full overflow-y-auto brand-sidebar-scroll space-y-3.5 pr-1">
          {/* Card 1: Add New Product */}
          {canCreate && (
            <div className="bg-white rounded-2xl shadow-xs px-4 py-3 flex items-center">
              <button
                type="button"
                onClick={openAddModal}
                className="w-full h-[32px] flex items-center justify-center gap-1.5 bg-[#0096C7] hover:bg-[#0083ae] active:bg-[#007096] text-white font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <PlusOutlined className="text-xs" />
                <span>Add New Product</span>
              </button>
            </div>
          )}

          {/* Card 2: Catalog Summary (Static Clean View) */}
          <div className="bg-white rounded-2xl shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h4 className="text-xs font-bold text-slate-900">Catalog Summary</h4>
              <span className="text-[10px] font-bold text-[#0096C7] bg-sky-50 px-2.5 py-0.5 rounded-full">
                Live Metrics
              </span>
            </div>

            <div className="space-y-1">
              {/* Metric 1: Total Products */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Total Products
                  </span>
                  <span className="text-2xl font-black text-slate-900 leading-tight block">
                    {products.length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Available in catalog
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0096C7] flex items-center justify-center text-lg shrink-0">
                  <ShoppingOutlined />
                </div>
              </div>

              {/* Metric 2: Low & Out of Stock */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Low / Out of Stock
                  </span>
                  <span className="text-2xl font-black text-amber-600 leading-tight block">
                    {products.filter((p) => p.stock <= 10).length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Needs replenishment
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg shrink-0">
                  <WarningOutlined />
                </div>
              </div>

              {/* Metric 3: Active Listings */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Active Listings
                  </span>
                  <span className="text-2xl font-black text-emerald-600 leading-tight block">
                    {products.filter((p) => p.status === 'active').length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Live in customer store
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

      {/* Add / Edit Product Modal using Reusable AppModal */}
      <AppModal
        open={isModalOpen}
        title={editingProduct ? 'Edit Product' : 'Create New Product'}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleFormSubmit}
        confirmLoading={submitting}
        okText={editingProduct ? 'Update Product' : 'Create Product'}
        width={720}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <AppInput
                label="Product Title *"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. AeroPulse Wireless Headphones"
              />
            </div>

            <div>
              <AppInput
                label="SKU Identifier *"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="AP-ANC-01"
              />
            </div>

            <div>
              <AppInput
                label="Brand / Manufacturer"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g. Himalaya Herbals, The Ordinary, CeraVe"
              />
              {formData.brand.trim() && (
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Tag product by brand:</span>
                  <button
                    type="button"
                    onClick={() => handleAddTag(formData.brand.trim())}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                      formData.tags.some((t) => t.toLowerCase() === formData.brand.trim().toLowerCase())
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <span>🏷️</span>
                    <span>
                      {formData.tags.some((t) => t.toLowerCase() === formData.brand.trim().toLowerCase())
                        ? `Tagged as #${formData.brand.trim()} ✓`
                        : `+ Add #${formData.brand.trim()} as Tag`}
                    </span>
                  </button>
                </div>
              )}
            </div>

            <div>
              <AppSelect
                label="Department Category *"
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: val as string })}
                options={categories.map((c) => ({
                  label: c.name,
                  value: c._id || c.id || '',
                }))}
              />
            </div>

            <div>
              <AppInput
                label="Regular Price ($) *"
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="249.99"
              />
            </div>

            <div>
              <AppInput
                label="Sale Price ($) (Optional)"
                type="number"
                step="0.01"
                min="0"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                placeholder="199.99"
              />
            </div>

            <div>
              <AppInput
                label="Warehouse Stock Units *"
                type="number"
                min="0"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="50"
              />
            </div>

            <div>
              <AppSelect
                label="Visibility Status"
                value={formData.status}
                onChange={(val) => setFormData({ ...formData, status: val as string })}
                options={[
                  { label: 'Active (Storefront visible)', value: 'active' },
                  { label: 'Draft (Internal hidden)', value: 'draft' },
                  { label: 'Archived', value: 'archived' },
                ]}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Product Image (Cloudinary)
              </label>
              <div className="flex flex-col sm:flex-row items-start gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                {formData.image ? (
                  <div className="relative group w-24 h-24 rounded-lg overflow-hidden border border-slate-300 bg-white flex-shrink-0 shadow-sm">
                    <img
                      src={formData.image}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, image: '' }))}
                      className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-medium cursor-pointer"
                    >
                      <DeleteOutlined className="mr-1" /> Remove
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 flex-shrink-0">
                    <PictureOutlined style={{ fontSize: '24px' }} />
                    <span className="text-[10px] mt-1 text-slate-500">No Image</span>
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <Upload
                    beforeUpload={(file) => {
                      handleImageUpload(file);
                      return false;
                    }}
                    showUploadList={false}
                    accept="image/*"
                    disabled={uploadingImage}
                  >
                    <button
                      type="button"
                      disabled={uploadingImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {uploadingImage ? <LoadingOutlined spin /> : <UploadOutlined />}
                      <span>{uploadingImage ? 'Uploading to Cloudinary...' : (formData.image ? 'Replace Image' : 'Upload Image')}</span>
                    </button>
                  </Upload>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Uploads directly to Cloudinary folder <code className="text-[10px] bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-700">HimalayaOnlineShop</code>. Only the secure URL is saved in the database.
                  </p>
                </div>
              </div>
            </div>

            {/* Product Tags & Classification Section */}
            <div className="sm:col-span-2 p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  Product Tags & Classifications (e.g., Oily Skin, Fair Skin, Organic)
                </label>
                <span className="text-[10px] text-slate-500 font-medium">
                  {formData.tags.length} tag{formData.tags.length === 1 ? '' : 's'} added
                </span>
              </div>

              {/* Tag Input Field & Add Button */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Type tag (e.g. Oily Skin, Fair Skin, Anti-Aging) & press Enter..."
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:outline-none focus:border-[#0096C7]"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  className="px-3.5 py-1.5 bg-[#0096C7] hover:bg-[#0077b6] text-white text-xs font-semibold rounded-lg transition cursor-pointer shrink-0 shadow-xs"
                >
                  + Add Tag
                </button>
              </div>

              {/* Active Selected Tags Pills */}
              {formData.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200 shadow-xs"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-sky-600 hover:text-rose-600 font-bold ml-0.5 text-xs cursor-pointer transition-colors"
                        title="Remove tag"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Quick Tag by Brand */}
              <div className="pt-2 border-t border-slate-200/80">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>🏷️ Quick Tag by Brand (Click to assign brand tag):</span>
                  <span className="text-[10px] text-slate-400 font-normal">Click to toggle tag</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {allAvailableBrands.map((brandName) => {
                    const isSelected = formData.tags.some(
                      (t) => t.toLowerCase() === brandName.toLowerCase()
                    );
                    return (
                      <button
                        key={brandName}
                        type="button"
                        onClick={() => handleTogglePresetTag(brandName)}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full border transition cursor-pointer font-medium ${
                          isSelected
                            ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                            : 'bg-amber-50/70 border-amber-200 text-amber-800 hover:border-amber-400 hover:bg-amber-100'
                        }`}
                      >
                        {isSelected ? '✓ #' : '+ #'}
                        {brandName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Presets / Suggestions */}
              <div className="pt-2 border-t border-slate-200/80">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Popular & Beauty / Skincare Presets (Click to toggle):
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {PRESET_TAGS.map((preset) => {
                    const isSelected = formData.tags.some(
                      (t) => t.toLowerCase() === preset.toLowerCase()
                    );
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleTogglePresetTag(preset)}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full border transition cursor-pointer font-medium ${
                          isSelected
                            ? 'bg-sky-600 border-sky-600 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-sky-400 hover:text-[#0096C7]'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <AppInput
                label="Short Description / Highlights"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Brief summary sentence..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Product Overview
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Specifications, build materials, dimensions..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#0096C7]"
              />
            </div>

            <div className="sm:col-span-2 pt-1">
              <Checkbox
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              >
                <span className="text-xs font-medium text-slate-700">
                  Feature in storefront showcase header banner
                </span>
              </Checkbox>
            </div>
          </div>
        </form>
      </AppModal>

      {/* Product Marketing & Advertisement QR Hub */}
      <ProductQrModal
        product={qrProduct}
        open={Boolean(qrProduct)}
        onClose={() => setQrProduct(null)}
      />

      {/* Product Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={Boolean(productToDelete)}
        title="Delete Product Confirmation"
        itemName={productToDelete?.name}
        itemType="Product"
        description={
          productToDelete && (
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-mono font-bold text-[#0096C7] bg-white px-2 py-0.5 rounded border border-sky-100">
                {productToDelete.sku}
              </span>
              <span className="text-slate-400">•</span>
              <span className="font-black text-slate-800">${productToDelete.price?.toFixed(2)}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 font-medium">{productToDelete.stock} in stock</span>
            </div>
          )
        }
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
};

export default ProductManagement;
