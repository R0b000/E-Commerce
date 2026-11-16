import React, { useEffect, useState } from 'react';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Tag, Popconfirm, Spin } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { Category } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import {
  AppCard,
  AppButton,
  AppInput,
  AppModal,
  PageHeader,
  CardSkeleton,
} from 'shared-components';

export const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
  });

  const { showToast } = useToast();

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
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image: cat.image || '',
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
    if (!formData.name) {
      showToast('Please provide a category name', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        const catId = editingCategory._id || editingCategory.id;
        const res = await ecommerceService.updateCategory(catId!, formData);
        if (res.success) {
          showToast('Category updated successfully', 'success');
          setIsModalOpen(false);
          loadCategories();
        }
      } else {
        const res = await ecommerceService.createCategory(formData);
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

  const handleDeleteCategory = async (cat: Category) => {
    const catId = cat._id || cat.id;
    if (cat.productCount && cat.productCount > 0) {
      showToast(`Cannot delete category with ${cat.productCount} assigned products. Reassign or remove products first.`, 'error');
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments & Taxonomies"
        description="Classify products into distinct store categories and collections."
        breadcrumbs={[{ label: 'Admin', path: '/admin' }, { label: 'Categories' }]}
        extra={
          <AppButton
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddModal}
            style={{ backgroundColor: '#0096C7' }}
          >
            New Category
          </AppButton>
        }
      />

      {loading ? (
        <CardSkeleton count={6} columns={3} />
      ) : categories.length === 0 ? (
        <AppCard>
          <div className="p-12 text-center">
            <AppstoreOutlined className="text-4xl text-slate-400 mb-2" />
            <p className="text-slate-800 font-semibold">No departments found</p>
            <AppButton
              type="primary"
              onClick={openAddModal}
              className="mt-3"
              style={{ backgroundColor: '#0096C7' }}
            >
              Create Category
            </AppButton>
          </div>
        </AppCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const catId = cat._id || cat.id;
            return (
              <AppCard
                key={catId}
                bodyStyle={{ padding: 0 }}
                className="overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img
                      src={cat.image || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600'}
                      alt={cat.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-slate-800 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md shadow-xs border border-slate-200">
                        /{cat.slug}
                      </span>
                      <Tag color="cyan" className="m-0 font-bold px-2 py-0.5 shadow-xs">
                        {cat.productCount ?? 0} Products
                      </Tag>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-base font-bold text-slate-900">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {cat.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="p-3 px-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
                  <AppButton
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openEditModal(cat)}
                  >
                    Edit
                  </AppButton>
                  <Popconfirm
                    title="Delete Category"
                    description={`Delete category "${cat.name}"?`}
                    onConfirm={() => handleDeleteCategory(cat)}
                    okText="Yes, Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <AppButton
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                    >
                      Delete
                    </AppButton>
                  </Popconfirm>
                </div>
              </AppCard>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AppModal
        open={isModalOpen}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleFormSubmit}
        confirmLoading={submitting}
        okText={editingCategory ? 'Update Category' : 'Create Category'}
        width={540}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
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

          <div>
            <AppInput
              label="Cover Image URL"
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://images.unsplash.com/..."
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
        </form>
      </AppModal>
    </div>
  );
};

export default CategoryManagement;
