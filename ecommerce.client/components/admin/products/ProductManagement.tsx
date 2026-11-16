import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
  StarFilled,
  WarningOutlined,
} from '@ant-design/icons';
import { Tag, Checkbox, Spin, Popconfirm } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { Product, Category } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from 'auth-client/hooks/useAuth';
import {
  AppCard,
  AppButton,
  AppInput,
  AppSelect,
  AppModal,
  PageHeader,
  StatusBadge,
} from 'shared-components';

export const ProductManagement: React.FC = () => {
  const { user } = useAuth();
  const isSeller = user?.role === 'seller';
  const isAdmin = user?.role === 'admin';

  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const { showToast } = useToast();

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
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      isFeatured: false,
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
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

  return (
    <div className="space-y-6">
      {/* Reusable Page Header */}
      <PageHeader
        title={isSeller ? 'My Products & Inventory' : 'Products & Inventory'}
        description={
          isSeller
            ? 'Manage your store catalog listings, warehouse inventory, and selling prices.'
            : 'Maintain your entire catalog, warehouse stock quantities, and retail pricing.'
        }
        breadcrumbs={[{ label: isSeller ? 'Seller' : 'Admin', path: '/admin' }, { label: 'Products' }]}
        extra={
          <AppButton
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddModal}
            style={{ backgroundColor: '#0096C7' }}
          >
            Add New Product
          </AppButton>
        }
      />

      {/* Filter and Search Bar inside Reusable AppCard */}
      <AppCard>
        <div className="flex flex-col md:flex-row items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <AppInput
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by title, SKU, or specs..."
              allowClear
            />
          </form>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <AppSelect
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val as string)}
              style={{ width: 180 }}
              options={[
                { label: 'All Departments', value: 'all' },
                ...categories.map((c) => ({
                  label: c.name,
                  value: c._id || c.id || '',
                })),
              ]}
            />

            <AppSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as string)}
              style={{ width: 140 }}
              options={[
                { label: 'All Statuses', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Draft', value: 'draft' },
                { label: 'Archived', value: 'archived' },
              ]}
            />

            <AppButton
              icon={<SyncOutlined />}
              onClick={loadData}
              title="Refresh"
            />
          </div>
        </div>
      </AppCard>

      {/* Products Table Card */}
      <AppCard bodyStyle={{ padding: 0 }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[12px] font-medium text-slate-600 uppercase tracking-wider bg-slate-50/70">
                <th className="py-3 px-6 font-medium text-[12px]">Product</th>
                <th className="py-3 px-4 font-medium text-[12px]">SKU</th>
                <th className="py-3 px-4 font-medium text-[12px]">Department</th>
                <th className="py-3 px-4 font-medium text-[12px]">Price</th>
                <th className="py-3 px-4 font-medium text-[12px]">Stock Units</th>
                <th className="py-3 px-4 font-medium text-[12px]">Status</th>
                <th className="py-3 px-6 text-right font-medium text-[12px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                    <Spin />
                    <p className="mt-2 text-xs">Loading catalog inventory...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    No products found matching query.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const pId = p._id || p.id || '';
                  const categoryName = typeof p.category === 'object' ? p.category.name : 'General';
                  const isLow = p.stock <= 5;
                  const isOut = p.stock === 0;

                  return (
                    <tr key={pId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                            alt={p.name}
                            className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0 w-[20vw]">
                            <div className="font-semibold text-slate-900 text-xs truncate flex items-center gap-1.5">
                              {p.name}
                              {p.isFeatured && (
                                <StarFilled className="text-amber-400 text-xs" title="Featured Item" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">{p.shortDescription || p.description}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono text-xs font-semibold text-[#0096C7]">
                        {p.sku}
                      </td>

                      <td className="py-4 px-4">
                        <Tag className="m-0 font-medium text-xs px-2 py-0.5 rounded border-slate-200 bg-slate-100 text-slate-700">
                          {categoryName}
                        </Tag>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          ${p.salePrice ? p.salePrice.toFixed(2) : p.price.toFixed(2)}
                        </div>
                        {p.salePrice && (
                          <div className="text-xs text-slate-400 line-through">
                            ${p.price.toFixed(2)}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Tag
                            color={isOut ? 'error' : isLow ? 'warning' : 'success'}
                            className="m-0 font-bold text-xs px-2 py-0.5"
                          >
                            {p.stock} units
                          </Tag>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStockAdjust(p, -1)}
                              className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs flex items-center justify-center font-bold"
                              title="Decrease 1"
                            >
                              -
                            </button>
                            <button
                              onClick={() => handleStockAdjust(p, +5)}
                              className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs flex items-center justify-center font-bold"
                              title="Add 5"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <StatusBadge status={p.status} />
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <AppButton
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openEditModal(p)}
                            title="Edit Product"
                          />
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
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </AppCard>

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
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
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
              <AppInput
                label="Cover Image URL"
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://images.unsplash.com/..."
              />
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
