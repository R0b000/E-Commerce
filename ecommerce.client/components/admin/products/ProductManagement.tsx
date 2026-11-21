import React, { useEffect, useState } from 'react';
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
} from '@ant-design/icons';
import { Tag, Checkbox, Spin, Popconfirm, Breadcrumb, Upload } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { Product, Category } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from 'auth-client/hooks/useAuth';
import { usePermissions } from '../../../context/PermissionContext';
import {
  AppTable,
  AppButton,
  AppInput,
  AppSelect,
  AppModal,
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    salePrice: '',
    stock: '',
    description: '',
    shortDescription: '',
    image: '',
    isFeatured: false,
    status: 'active',
  });
  const [uploadingImage, setUploadingImage] = useState(false);

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
  }, [selectedCategory, statusFilter]);

  useEffect(() => {
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
      category: categories[0]?._id || categories[0]?.id || '',
      price: '',
      salePrice: '',
      stock: '25',
      description: '',
      shortDescription: '',
      image: '',
      isFeatured: false,
      status: 'active',
    });
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
      category: catId || '',
      price: product.price.toString(),
      salePrice: product.salePrice ? product.salePrice.toString() : '',
      stock: product.stock.toString(),
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      image: product.images?.[0] || '',
      isFeatured: product.isFeatured || false,
      status: product.status || 'active',
    });
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
        category: formData.category,
        price: parseFloat(formData.price),
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
        stock: parseInt(formData.stock, 10),
        description: formData.description,
        shortDescription: formData.shortDescription,
        images: formData.image ? [formData.image] : [],
        isFeatured: formData.isFeatured,
        status: formData.status,
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

  const handleDeleteProduct = async (id: string) => {
    if (!canDelete) {
      showToast('Permission denied: You do not have permission to delete products', 'error');
      return;
    }
    try {
      const res = await ecommerceService.deleteProduct(id);
      if (res.success) {
        showToast('Product deleted successfully', 'success');
        setProducts((prev) => prev.filter((p) => (p._id || p.id) !== id));
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to delete product', 'error');
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
    <div className="w-full font-['Poppins','Inter',sans-serif]">
      {/* Breadcrumb Navigation */}
      <div className="px-2 flex items-center gap-1.5 text-[11px] leading-none text-slate-400 mb-0 pb-0">
        <Breadcrumb
          className="text-[11px] leading-none text-slate-400 [&_*]:border-0"
          items={[
            {
              title: (
                <Link to="/admin" className="text-slate-400 hover:text-[#0096C7] transition-colors">
                  {isSeller ? 'Seller' : 'Admin'}
                </Link>
              ),
            },
            {
              title: <span className="text-slate-600 font-medium">Products</span>,
            },
          ]}
        />
      </div>

      {/* Main Products Directory Card with Integrated Header */}
      <div className="bg-white rounded-t-2xl rounded-b-md shadow-xs">
        {/* Table Top Controls & Integrated Header (relative z-20 so dropdown floats cleanly over table) */}
        <div className="px-2 py-3 sm:py-3.5 border-b border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white relative z-20 rounded-t-2xl">
          <div className="flex flex-col min-w-0">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {isSeller ? 'My Products & Inventory' : 'Products & Inventory'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
              {isSeller
                ? 'Manage your store catalog listings, warehouse inventory, and selling prices.'
                : 'Maintain your entire catalog, warehouse stock quantities, and retail pricing.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="w-full sm:w-[260px] shrink-0">
              <AppInput
                prefix={<SearchOutlined className="text-slate-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                allowClear
              />
            </form>

            {/* Department Dropdown */}
            <div className="w-full sm:w-[160px] shrink-0">
              <AppSelect
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val as string)}
                options={[
                  { label: 'All Departments', value: 'all' },
                  ...categories.map((c) => ({
                    label: c.name,
                    value: c._id || c.id || '',
                  })),
                ]}
              />
            </div>

            {/* Status Dropdown */}
            <div className="w-full sm:w-[130px] shrink-0">
              <AppSelect
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as string)}
                options={[
                  { label: 'All Statuses', value: 'all' },
                  { label: 'Active', value: 'active' },
                  { label: 'Draft', value: 'draft' },
                  { label: 'Archived', value: 'archived' },
                ]}
              />
            </div>

            {/* Add New Product Button */}
            {canCreate && (
              <AppButton
                type="primary"
                icon={<PlusOutlined />}
                onClick={openAddModal}
                className="shrink-0"
                style={{ backgroundColor: '#0096C7' }}
              >
                Add Product
              </AppButton>
            )}
          </div>
        </div>

        {/* Products Table Wrapper */}
        <div className="overflow-hidden">
          <AppTable>
            <thead>
              <tr>
                <th className="py-2.5 px-6 font-medium text-[12px]">Product & SKU</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Department</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Price</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Stock Units</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Status</th>
                <th className="py-2.5 px-6 text-right font-medium text-[12px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton columns={6} rows={6} hasAvatar={true} />
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No products found matching query.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const pId = p._id || p.id || '';
                  const categoryName = typeof p.category === 'object' ? p.category.name : 'General';
                  const isLow = p.stock <= 5;
                  const isOut = p.stock === 0;

                  return (
                    <tr key={pId} className="hover:bg-slate-50/70 transition-colors group cursor-default">
                      {/* Product & SKU */}
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div className="max-w-[220px]">
                            <div className="font-bold text-slate-900 text-xs truncate flex items-center gap-1.5">
                              {p.name}
                              {p.isFeatured && (
                                <StarFilled className="text-amber-400 text-xs" title="Featured Item" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              SKU: {p.sku || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Tag className="m-0 font-semibold text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 border-slate-200 text-slate-700">
                          {categoryName}
                        </Tag>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
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
                      <td className="py-3.5 px-4 whitespace-nowrap">
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
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={p.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <AppButton
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => openEditModal(p)}
                              title="Edit Product"
                            />
                          )}
                          {canDelete && (
                            <Popconfirm
                              title="Delete Product"
                              description={`Delete "${p.name}"?`}
                              onConfirm={() => handleDeleteProduct(pId)}
                              okText="Yes, Delete"
                              cancelText="Cancel"
                              okButtonProps={{ danger: true }}
                            >
                              <AppButton
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                title="Delete Product"
                              />
                            </Popconfirm>
                          )}
                          {!canEdit && !canDelete && (
                            <span className="text-[10px] text-slate-400 font-mono italic">Read-only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </AppTable>
        </div>

        {/* Table Footer: Count on Left, Pagination on Right (Matching Header Height ~30px & Subtle Roundness rounded-b-md) */}
        <div className="px-6 h-[30px] min-h-[30px] bg-[#0096C7] text-white rounded-b-md flex items-center justify-between text-[11px] shadow-inner select-none">
          {/* Left Side: Product Count */}
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-medium text-white/90 text-[11px] leading-none">Total Products:</span>
            <span className="font-bold text-white text-[11px] leading-none">
              {products.length} Items
            </span>
          </div>

          {/* Right Side: Pagination Controls (Rendered ONLY if products > 10) */}
          {products.length > 10 && (
            <div className="flex items-center gap-2.5 leading-none">
              <div className="flex items-center gap-1 text-[10px] text-white/95 font-medium leading-none">
                <span>Rows:</span>
                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="appearance-none bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-[10px] rounded pl-1.5 pr-4 py-0 outline-none cursor-pointer transition-colors focus:ring-1 focus:ring-white h-[20px] leading-none"
                  >
                    <option value={10} className="bg-slate-800 text-white">10</option>
                    <option value={20} className="bg-slate-800 text-white">20</option>
                    <option value={50} className="bg-slate-800 text-white">50</option>
                    <option value={100} className="bg-slate-800 text-white">100</option>
                  </select>
                  <DownOutlined className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[7px] text-white/80" />
                </div>
              </div>

              <span className="text-[10px] text-white/95 font-medium whitespace-nowrap leading-none">
                {products.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, products.length)} of {products.length}
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
                  className="w-6 h-6 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 active:bg-white/30 disabled:opacity-30 disabled:hover:bg-white/15 disabled:cursor-not-allowed text-white transition-all cursor-pointer border border-white/20"
                >
                  <RightOutlined className="text-[8px]" />
                </button>
              </div>
            </div>
          )}
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
    </div>
  );
};

export default ProductManagement;
