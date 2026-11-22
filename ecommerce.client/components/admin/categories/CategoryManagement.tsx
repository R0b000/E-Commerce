import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  LeftOutlined,
  RightOutlined,
  DownOutlined,
  PictureOutlined,
  UploadOutlined,
  LoadingOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { Tag, Popconfirm, Switch, Breadcrumb, InputNumber, Upload, Dropdown } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { Category } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../context/PermissionContext';
import {
  AppTable,
  AppButton,
  AppInput,
  AppSelect,
  AppModal,
  TableSkeleton,
  StatusBadge,
} from 'shared-components';

export const CategoryManagement: React.FC = () => {
  const { can } = usePermissions();
  const canCreateCategory = can('create', 'categories');
  const canEditCategory = can('edit', 'categories');
  const canDeleteCategory = can('delete', 'categories');

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    isActive: true,
    displayOrder: 0,
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const { showToast } = useToast();

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const res = await ecommerceService.uploadImage(file, 'HimalayaOnlineShop');
      if (res.success && res.data?.url) {
        setFormData((prev) => ({ ...prev, image: res.data.url }));
        showToast('Category image uploaded to Cloudinary successfully', 'success');
      } else {
        showToast(res.messages?.[0] || 'Image upload failed', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to upload category image', 'error');
    } finally {
      setUploadingImage(false);
    }
    return false;
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await ecommerceService.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch {
      showToast('Error loading categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = () => {
    if (!canCreateCategory) {
      showToast('Permission denied: You do not have permission to create categories', 'error');
      return;
    }
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
      isActive: true,
      displayOrder: categories.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    if (!canEditCategory) {
      showToast('Permission denied: You do not have permission to edit categories', 'error');
      return;
    }
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image: cat.image || '',
      isActive: cat.isActive !== false,
      displayOrder: cat.displayOrder ?? 0,
    });
    setIsModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : slug,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Please provide a category name', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<Category> = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: formData.description,
        image: formData.image || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
        isActive: formData.isActive,
        displayOrder: Number(formData.displayOrder) || 0,
      };

      if (editingCategory) {
        const catId = editingCategory._id || editingCategory.id;
        const res = await ecommerceService.updateCategory(catId!, payload);
        if (res.success) {
          showToast('Category updated successfully', 'success');
          setIsModalOpen(false);
          loadCategories();
        }
      } else {
        const res = await ecommerceService.createCategory(payload);
        if (res.success) {
          showToast('Category created successfully', 'success');
          setIsModalOpen(false);
          loadCategories();
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Error saving category', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (cat: Category) => {
    if (!canEditCategory) {
      showToast('Permission denied: You do not have permission to edit categories', 'error');
      return;
    }
    const catId = cat._id || cat.id;
    const newActive = cat.isActive === false;
    try {
      const res = await ecommerceService.updateCategory(catId!, { isActive: newActive });
      if (res.success) {
        showToast(`Category "${cat.name}" is now ${newActive ? 'active' : 'inactive'}`, 'success');
        setCategories((prev) =>
          prev.map((c) => ((c._id || c.id) === catId ? { ...c, isActive: newActive } : c))
        );
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to update category status', 'error');
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!canDeleteCategory) {
      showToast('Permission denied: You do not have permission to delete categories', 'error');
      return;
    }
    const catId = cat._id || cat.id;
    if (cat.productCount && cat.productCount > 0) {
      showToast(
        `Cannot delete category with ${cat.productCount} assigned products. Reassign or remove products first.`,
        'error'
      );
      return;
    }

    try {
      const res = await ecommerceService.deleteCategory(catId!);
      if (res.success) {
        showToast('Category removed', 'success');
        setCategories((prev) => prev.filter((c) => (c._id || c.id) !== catId));
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to delete category', 'error');
    }
  };

  // Filter Categories
  const filteredCategories = categories.filter((cat) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchName = cat.name.toLowerCase().includes(query);
      const matchSlug = cat.slug.toLowerCase().includes(query);
      const matchDesc = (cat.description || '').toLowerCase().includes(query);
      if (!matchName && !matchSlug && !matchDesc) return false;
    }

    if (statusFilter === 'active' && cat.isActive === false) return false;
    if (statusFilter === 'inactive' && cat.isActive !== false) return false;

    if (productFilter === 'has_products' && (!cat.productCount || cat.productCount === 0)) return false;
    if (productFilter === 'empty' && (cat.productCount && cat.productCount > 0)) return false;

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
              title: <span className="text-slate-800 font-bold">Categories</span>,
            },
          ]}
        />
      </div>

      {/* Two-Column Responsive Layout: Left Table Directory + Right Summary & Actions (Independent Scroll) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row items-stretch gap-3 sm:gap-4 overflow-hidden">
        {/* Left Column: Categories Directory Table */}
        <div className="flex-1 min-w-0 h-full bg-white rounded-t-2xl rounded-b-[2px] shadow-xs overflow-hidden flex flex-col">
          {/* Header Toolbar: Title + Search + Filters */}
          <div className="pl-0 pr-4 py-3 flex items-center justify-between gap-3 bg-white shrink-0">
            <div className="shrink-0">
              <h3 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
                Departments & Taxonomies
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {/* Search Input */}
              <div className="w-full sm:w-[200px]">
                <AppInput
                  prefix={<SearchOutlined className="text-slate-400" />}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search categories..."
                  allowClear
                />
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-[120px] shrink-0">
                <AppSelect
                  value={statusFilter}
                  onChange={(val) => {
                    setStatusFilter(val as string);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: 'All Status', value: 'all' },
                    { label: 'Active', value: 'active' },
                    { label: 'Inactive', value: 'inactive' },
                  ]}
                />
              </div>

              {/* Product Count Filter */}
              <div className="w-full sm:w-[130px] shrink-0">
                <AppSelect
                  value={productFilter}
                  onChange={(val) => {
                    setProductFilter(val as string);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: 'All Products', value: 'all' },
                    { label: 'With Products', value: 'has_products' },
                    { label: 'No Products', value: 'empty' },
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
          ) : filteredCategories.length === 0 ? (
            <div className="p-12 text-center flex-1 min-h-0 overflow-y-auto">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-lg">
                <AppstoreOutlined />
              </div>
              <h4 className="text-sm font-bold text-slate-700">No categories found</h4>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or add a new category.</p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto brand-table-scroll relative">
              <table className="kiran-role-table app-table w-full border-collapse">
                <thead className="sticky top-0 z-20 shadow-xs">
                  <tr className="bg-[#0096C7]">
                    <th className="sticky top-0 z-20 !bg-[#0096C7] !text-white py-2.5 px-4 font-semibold text-[12px] whitespace-nowrap shadow-xs">
                      Category
                    </th>
                    <th className="sticky top-0 z-20 !bg-[#0096C7] !text-white py-2.5 px-4 font-semibold text-[12px] whitespace-nowrap shadow-xs">
                      Description
                    </th>
                    <th className="sticky top-0 z-20 !bg-[#0096C7] !text-white py-2.5 px-4 font-semibold text-[12px] whitespace-nowrap shadow-xs">
                      Products
                    </th>
                    <th className="sticky top-0 z-20 !bg-[#0096C7] !text-white py-2.5 px-4 font-semibold text-[12px] whitespace-nowrap shadow-xs">
                      Order
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
                  {paginatedCategories.map((cat) => {
                    const catId = cat._id || cat.id;
                    const hasAssignedProducts = (cat.productCount ?? 0) > 0;

                    return (
                      <tr
                        key={catId}
                        className="hover:bg-sky-50/40 transition-colors group cursor-default"
                      >
                        {/* Category & Slug */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {cat.image ? (
                              <img
                                src={cat.image}
                                alt={cat.name}
                                className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=200&q=80';
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                <PictureOutlined className="text-base" />
                              </div>
                            )}
                            <div className="max-w-[240px]">
                              <div className="font-bold text-slate-900 text-xs truncate">
                                {cat.name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                /{cat.slug}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="py-3 px-4">
                          <div className="max-w-[280px] text-xs text-slate-600 truncate" title={cat.description}>
                            {cat.description || (
                              <span className="text-slate-300 italic">No description provided</span>
                            )}
                          </div>
                        </td>

                        {/* Products Count */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Tag color="cyan" className="m-0 font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                            {cat.productCount ?? 0} Products
                          </Tag>
                        </td>

                        {/* Display Order */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            #{cat.displayOrder ?? 0}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Switch
                              size="small"
                              checked={cat.isActive !== false}
                              disabled={!canEditCategory}
                              onChange={() => handleToggleStatus(cat)}
                            />
                            <StatusBadge status={cat.isActive !== false ? 'active' : 'inactive'} />
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {canEditCategory && (
                              <AppButton
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => openEditModal(cat)}
                                title="Edit Category"
                              />
                            )}
                            {canDeleteCategory && (
                              <Popconfirm
                                title="Delete Category"
                                description={
                                  hasAssignedProducts
                                    ? `Cannot delete "${cat.name}" because it has ${cat.productCount} assigned products. Reassign or delete products first.`
                                    : `Are you sure you want to delete category "${cat.name}"?`
                                }
                                onConfirm={() => handleDeleteCategory(cat)}
                                okText="Yes, Delete"
                                cancelText="Cancel"
                                okButtonProps={{ danger: true, disabled: hasAssignedProducts }}
                              >
                                <AppButton
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  disabled={hasAssignedProducts}
                                  title={hasAssignedProducts ? 'Cannot delete category with products' : undefined}
                                />
                              </Popconfirm>
                            )}
                            {!canEditCategory && !canDeleteCategory && (
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
              {filteredCategories.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min(currentPage * pageSize, filteredCategories.length)} of {filteredCategories.length}
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

        {/* Right Column: New Category Card + Category Summary Metrics (Independent Scroll Area) */}
        <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 h-full overflow-y-auto brand-sidebar-scroll space-y-3.5 pr-1">
          {/* Card 1: New Category */}
          {canCreateCategory && (
            <div className="bg-white rounded-2xl shadow-xs px-4 py-3 flex items-center">
              <button
                type="button"
                onClick={openAddModal}
                className="w-full h-[32px] flex items-center justify-center gap-1.5 bg-[#0096C7] hover:bg-[#0083ae] active:bg-[#007096] text-white font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <PlusOutlined className="text-xs" />
                <span>New Category</span>
              </button>
            </div>
          )}

          {/* Card 2: Category Summary (Static Clean View) */}
          <div className="bg-white rounded-2xl shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h4 className="text-xs font-bold text-slate-900">Category Summary</h4>
              <span className="text-[10px] font-bold text-[#0096C7] bg-sky-50 px-2.5 py-0.5 rounded-full">
                Live Metrics
              </span>
            </div>

            <div className="space-y-1">
              {/* Metric 1: Total Categories */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Total Categories
                  </span>
                  <span className="text-2xl font-black text-slate-900 leading-tight block">
                    {categories.length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Store departments
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0096C7] flex items-center justify-center text-lg shrink-0">
                  <AppstoreOutlined />
                </div>
              </div>

              {/* Metric 2: Total Items Tagged */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Items Tagged
                  </span>
                  <span className="text-2xl font-black text-amber-600 leading-tight block">
                    {categories.reduce((acc, c) => acc + (c.productCount || 0), 0)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Assigned in products
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg shrink-0">
                  <TagOutlined />
                </div>
              </div>

              {/* Metric 3: Active Categories */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Active Departments
                  </span>
                  <span className="text-2xl font-black text-emerald-600 leading-tight block">
                    {categories.filter((c) => c.isActive !== false).length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Visible on storefront
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

      {/* Add / Edit Category Modal */}
      <AppModal
        open={isModalOpen}
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Category'}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleFormSubmit}
        confirmLoading={submitting}
        okText={editingCategory ? 'Update Category' : 'Create Category'}
        width={560}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <AppInput
                label="Category Name *"
                required
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Mechanical Keyboards"
              />
            </div>

            <div>
              <AppInput
                label="URL Slug Identifier *"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="mechanical-keyboards"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category Image (Cloudinary)
            </label>
            <div className="flex flex-col sm:flex-row items-start gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              {formData.image ? (
                <div className="relative group w-20 h-20 rounded-lg overflow-hidden border border-slate-300 bg-white flex-shrink-0 shadow-sm">
                  <img
                    src={formData.image}
                    alt="Category preview"
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
                <div className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 flex-shrink-0">
                  <PictureOutlined style={{ fontSize: '22px' }} />
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
                  Uploads directly to Cloudinary folder <code className="text-[10px] bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-700">HimalayaOnlineShop</code>.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Display Order
            </label>
            <InputNumber
              min={0}
              max={999}
              value={formData.displayOrder}
              onChange={(val) => setFormData({ ...formData, displayOrder: val || 0 })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Briefly describe products in this category..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#0096C7]"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Switch
              checked={formData.isActive}
              onChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <span className="text-xs font-semibold text-slate-700">
              Active Category (Visible in store navigation and catalog)
            </span>
          </div>
        </form>
      </AppModal>
    </div>
  );
};

export default CategoryManagement;
