import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingOutlined,
  StarFilled,
  SearchOutlined,
  ThunderboltFilled,
  PlusOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { Tag, Spin, Input, Rate, Form, Select } from 'antd';
import { ecommerceService } from '../../services/EcommerceAPIService';
import { Product, Category, ReviewItem } from '../../types/ecommerce.types';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { AppCard, AppButton, AppModal } from 'shared-components';

export const StoreHomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm] = Form.useForm();

  const { addToCart } = useCart();
  const { showToast } = useToast();

  const loadReviews = async () => {
    try {
      const res = await ecommerceService.getReviews({ status: 'approved', limit: 8 });
      if (res.success && res.data) {
        setReviews(res.data);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          ecommerceService.getProducts({ limit: 50, status: 'active' }),
          ecommerceService.getCategories(),
        ]);
        if (prodRes.success && prodRes.data) {
          setProducts(prodRes.data.products);
        }
        if (catRes.success && catRes.data) {
          setCategories(catRes.data);
        }
        await loadReviews();
      } catch {
        showToast('Failed to load store catalog', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmitReview = async () => {
    try {
      const values = await reviewForm.validateFields();
      setSubmittingReview(true);
      const res = await ecommerceService.createReview({
        productId: values.productId,
        rating: values.rating,
        title: values.title,
        comment: values.comment,
        userName: values.userName,
        userEmail: values.userEmail,
      });
      if (res.success) {
        showToast('Thank you! Your verified review has been published.', 'success');
        setIsReviewModalOpen(false);
        reviewForm.resetFields();
        loadReviews();
      } else {
        showToast(res.messages?.[0] || 'Failed to submit review', 'error');
      }
    } catch (err: any) {
      if (err.errorFields) return;
      showToast('Error submitting review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    const catId = typeof p.category === 'object' ? (p.category._id || p.category.id) : p.category;
    const matchesCategory = selectedCategory === 'all' || catId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const featuredProduct = products.find((p) => p.isFeatured) || products[0];

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    addToCart(product, 1);
    showToast(`Added ${product.name} to your bag`, 'success');
  };

  return (
    <div className="space-y-14 pb-16">
      {/* Hero Banner Section */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 md:p-14 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-orange-400">
            <ThunderboltFilled /> Handcrafted in Nepal
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Authentic Himalayan Craftsmanship, Direct to Your Door
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Explore authentic singing bowls, organic mountain teas, pure pashmina shawls, and artisan crafts certified for ethical fair trade.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className="px-6 py-3 rounded-xl bg-[#f97316] hover:bg-[#ea580c] font-bold text-xs uppercase tracking-wider text-white transition-all shadow-md cursor-pointer"
            >
              Shop All Catalog
            </button>
          </div>
        </div>
      </section>

      {/* Category Strip */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Featured Categories</h3>
          <span className="text-xs text-slate-400">{categories.length} Curated Collections</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Items
          </button>
          {categories.map((c) => {
            const cId = (c._id || c.id || '') as string;
            return (
              <button
                key={cId}
                onClick={() => setSelectedCategory(cId)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cId
                    ? 'bg-[#0284c7] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Product Catalog Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Our Products</h3>
            <p className="text-xs text-slate-400">Discover premium handmade goods from verified Himalayan artisans</p>
          </div>
          <div className="w-64">
            <Input
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <Spin size="large" />
            <p className="mt-3">Loading catalog treasures...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm bg-slate-50 rounded-2xl">
            No products found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((p) => {
              const pId = p._id || p.id;
              return (
                <div
                  key={pId}
                  onClick={() => setQuickViewProduct(p)}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between"
                >
                  <div className="aspect-square bg-slate-100 overflow-hidden relative">
                    <img
                      src={p.images?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80'}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {p.salePrice && (
                      <span className="absolute top-2.5 left-2.5 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                        Sale
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                        <StarFilled />
                        <span>{p.rating || 5.0}</span>
                        <span className="text-slate-400 text-[10px]">({p.numReviews || 0})</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-1 group-hover:text-[#0284c7] transition-colors line-clamp-1">
                        {p.name}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {p.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="font-extrabold text-slate-900 text-base">
                          ${p.salePrice ? p.salePrice.toFixed(2) : p.price.toFixed(2)}
                        </div>
                        {p.salePrice && (
                          <div className="text-[10px] text-slate-400 line-through">
                            ${p.price.toFixed(2)}
                          </div>
                        )}
                      </div>

                      <AppButton
                        size="small"
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={(e) => handleAddToCart(p, e)}
                        style={{ backgroundColor: '#0284c7' }}
                      >
                        Add
                      </AppButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Verified Customer Reviews Section */}
      <section className="bg-slate-50 border border-slate-200/80 rounded-3xl p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 mb-1">
              <StarFilled />
              <span>Verified Buyer Testimonials</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              What Our Customers Say
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Authentic feedback and real product experiences from our global community.
            </p>
          </div>

          <AppButton
            type="primary"
            icon={<MessageOutlined />}
            onClick={() => setIsReviewModalOpen(true)}
            style={{ backgroundColor: '#f97316' }}
          >
            Write a Review
          </AppButton>
        </div>

        {/* Reviews Grid */}
        {reviews.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            No customer reviews yet. Be the first to review a handcrafted Himalayan treasure!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev._id || rev.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Rate disabled value={rev.rating} className="text-xs text-amber-500" />
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(rev.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {rev.title && (
                    <div className="font-bold text-slate-900 text-xs">{rev.title}</div>
                  )}

                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-semibold text-slate-800">{rev.userName}</span>
                    <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                      {rev.productName}
                    </div>
                  </div>
                  {rev.isVerifiedPurchase && (
                    <span className="text-emerald-700 font-medium text-[10px] flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircleOutlined /> Verified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Write a Review Modal */}
      <AppModal
        open={isReviewModalOpen}
        title="Write a Product Review"
        onCancel={() => {
          setIsReviewModalOpen(false);
          reviewForm.resetFields();
        }}
        onOk={handleSubmitReview}
        confirmLoading={submittingReview}
        okText="Submit Review"
        width={550}
      >
        <Form form={reviewForm} layout="vertical" className="pt-2">
          <Form.Item
            name="productId"
            label="Select Product"
            rules={[{ required: true, message: 'Please select a product' }]}
          >
            <Select
              placeholder="Choose a product to review..."
              options={products.map((p) => ({
                value: p._id || p.id,
                label: p.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="rating"
            label="Your Rating"
            initialValue={5}
            rules={[{ required: true }]}
          >
            <Rate />
          </Form.Item>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="userName"
              label="Your Name"
              rules={[{ required: true, message: 'Enter your name' }]}
            >
              <Input placeholder="e.g. Dolma Tenzing" />
            </Form.Item>
            <Form.Item
              name="userEmail"
              label="Your Email"
              rules={[{ required: true, type: 'email' }]}
            >
              <Input placeholder="dolma@example.com" />
            </Form.Item>
          </div>

          <Form.Item name="title" label="Review Headline (Optional)">
            <Input placeholder="e.g. Exquisite quality, exceeded expectations!" />
          </Form.Item>

          <Form.Item
            name="comment"
            label="Detailed Feedback"
            rules={[{ required: true, message: 'Please write your review comment' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Tell other buyers about texture, build, shipping speed, and craftsmanship..."
            />
          </Form.Item>
        </Form>
      </AppModal>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <AppModal
          open={!!quickViewProduct}
          title={`SKU: ${quickViewProduct.sku}`}
          onCancel={() => setQuickViewProduct(null)}
          footer={null}
          width={650}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="h-60 sm:h-full rounded-xl overflow-hidden bg-slate-100">
              <img
                src={quickViewProduct.images?.[0]}
                alt={quickViewProduct.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mb-1">
                  <StarFilled />
                  <span>{quickViewProduct.rating} / 5.0 Rating</span>
                </div>

                <h2 className="text-xl font-bold text-slate-900">{quickViewProduct.name}</h2>

                <div className="mt-2 text-2xl font-black text-slate-900">
                  ${quickViewProduct.salePrice ? quickViewProduct.salePrice.toFixed(2) : quickViewProduct.price.toFixed(2)}
                  {quickViewProduct.salePrice && (
                    <span className="ml-2 text-sm text-slate-400 line-through">
                      ${quickViewProduct.price.toFixed(2)}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                  {quickViewProduct.description}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-slate-500">
                    In Stock ({quickViewProduct.stock} units available)
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <AppButton
                  type="primary"
                  size="large"
                  block
                  icon={<ShoppingOutlined />}
                  onClick={() => {
                    handleAddToCart(quickViewProduct);
                    setQuickViewProduct(null);
                  }}
                  style={{ backgroundColor: '#0284c7' }}
                >
                  Add To Bag
                </AppButton>
              </div>
            </div>
          </div>
        </AppModal>
      )}
    </div>
  );
};

export default StoreHomePage;
