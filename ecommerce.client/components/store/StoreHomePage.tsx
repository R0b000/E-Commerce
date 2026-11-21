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
  LeftOutlined,
  RightOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { Tag, Spin, Input, Rate, Form, Select } from 'antd';
import { ecommerceService } from '../../services/EcommerceAPIService';
import { Product, Category, ReviewItem, BannerItem } from '../../types/ecommerce.types';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { AppCard, AppButton, AppModal, CardSkeleton } from 'shared-components';

export const StoreHomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
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
        const [prodRes, catRes, bannerRes] = await Promise.all([
          ecommerceService.getProducts({ limit: 50, status: 'active' }),
          ecommerceService.getCategories(),
          ecommerceService.getActiveBanners({ position: 'hero_main' }),
        ]);
        if (prodRes.success && prodRes.data) {
          setProducts(prodRes.data.products);
        }
        if (catRes.success && catRes.data) {
          setCategories(catRes.data);
        }
        if (bannerRes.success && bannerRes.data) {
          setBanners(bannerRes.data);
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

  // Auto-cycle through scheduled active banners every 7 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const handleBannerCtaClick = (banner: BannerItem, link?: string) => {
    ecommerceService.recordBannerClick(banner._id).catch(() => {});
    if (link) {
      if (link.startsWith('http')) {
        window.open(link, '_blank');
      } else if (link.startsWith('/#')) {
        const elementId = link.replace('/#', '');
        const elem = document.getElementById(elementId);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.location.hash = elementId;
        }
      } else {
        window.location.href = link;
      }
    }
  };

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
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      (p.brand && p.brand.toLowerCase().includes(query)) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(query)));

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
      {/* Hero Banner Section (Dynamic Auto-Scheduled Banners) */}
      {(() => {
        const currentBanner = banners.length > 0 ? banners[currentBannerIndex] : null;

        return (
          <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0369a1] via-[#0096c7] to-[#0284c7] text-white p-8 md:p-12 lg:p-16 shadow-xl border border-sky-400/20 transition-all duration-700">
            {/* Background Image & Overlay for dynamic scheduled banner */}
            {currentBanner?.imageUrl && (
              <>
                <img
                  src={currentBanner.imageUrl}
                  alt={currentBanner.title}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/75 to-slate-900/50"
                  style={{ opacity: Math.max(0.65, (currentBanner.overlayOpacity ?? 45) / 100) }}
                />
              </>
            )}

            {/* Ambient decorative glowing orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/15 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
            <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-sky-300/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Heading & CTAs */}
              <div
                className={`lg:col-span-7 space-y-5 ${
                  currentBanner?.alignment === 'center'
                    ? 'text-center mx-auto'
                    : currentBanner?.alignment === 'right'
                    ? 'text-right ml-auto'
                    : 'text-left'
                }`}
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-amber-200 border border-white/25 shadow-xs">
                  <ThunderboltFilled className="text-amber-300" />
                  <span>
                    {currentBanner?.badgeText || 'Handcrafted in Nepal • Ethically Sourced'}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
                  {currentBanner?.title || 'Authentic Himalayan Craftsmanship, Direct to Your Door'}
                </h1>

                <p className="text-sky-100 text-sm md:text-base leading-relaxed max-w-xl font-normal">
                  {currentBanner?.subtitle ||
                    'Explore authentic hand-hammered singing bowls, organic high-altitude teas, pure pashmina shawls, and artisan crafts certified for ethical fair trade.'}
                </p>

                <div
                  className={`pt-2 flex flex-wrap items-center gap-3 ${
                    currentBanner?.alignment === 'center'
                      ? 'justify-center'
                      : currentBanner?.alignment === 'right'
                      ? 'justify-end'
                      : ''
                  }`}
                >
                  <button
                    onClick={() =>
                      currentBanner
                        ? handleBannerCtaClick(currentBanner, currentBanner.ctaLink)
                        : setSelectedCategory('all')
                    }
                    className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] font-bold text-xs uppercase tracking-wider text-slate-950 transition-all shadow-lg shadow-amber-500/25 cursor-pointer flex items-center gap-2"
                  >
                    <span>{currentBanner?.ctaText || 'Shop All Catalog'}</span>
                    <span className="text-sm">→</span>
                  </button>

                  {(currentBanner?.secondaryCtaText || !currentBanner) && (
                    <button
                      onClick={() =>
                        currentBanner
                          ? handleBannerCtaClick(currentBanner, currentBanner.secondaryCtaLink)
                          : handleBannerCtaClick({ _id: '' } as any, '/#featured')
                      }
                      className="px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs uppercase tracking-wider backdrop-blur-md transition-all border border-white/30 cursor-pointer"
                    >
                      {currentBanner?.secondaryCtaText || 'Featured Items'}
                    </button>
                  )}
                </div>

                {/* Trust Badges */}
                <div
                  className={`pt-4 border-t border-white/15 flex flex-wrap items-center gap-6 text-xs text-sky-100 ${
                    currentBanner?.alignment === 'center'
                      ? 'justify-center'
                      : currentBanner?.alignment === 'right'
                      ? 'justify-end'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircleOutlined className="text-amber-300" />
                    <span>100% Artisan Made</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarFilled className="text-amber-300" />
                    <span>4.9 / 5 Customer Rating</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Fast Nationwide Delivery</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Featured Product Spotlight Card */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end">
                {featuredProduct ? (
                  <div
                    onClick={() => setQuickViewProduct(featuredProduct)}
                    className="w-full max-w-sm bg-white/15 backdrop-blur-md border border-white/25 rounded-3xl p-4 shadow-2xl hover:bg-white/20 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-white/20 mb-3.5">
                      <img
                        src={
                          featuredProduct.images?.[0] ||
                          'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80'
                        }
                        alt={featuredProduct.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                        Staff Spotlight
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-white font-bold text-base truncate group-hover:text-amber-200 transition-colors">
                          {featuredProduct.name}
                        </h4>
                        <span className="text-amber-300 font-extrabold text-base whitespace-nowrap">
                          ${(featuredProduct.salePrice ?? featuredProduct.price).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sky-100 text-xs line-clamp-2 leading-relaxed">
                        {featuredProduct.description}
                      </p>
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[11px] text-sky-200">Click to view details</span>
                        <button
                          onClick={(e) => handleAddToCart(featuredProduct, e)}
                          className="px-3 py-1.5 rounded-lg bg-white text-[#0096C7] hover:bg-amber-400 hover:text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <ShoppingOutlined /> Add to Bag
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-sm aspect-4/3 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/60">
                    <ShoppingOutlined className="text-4xl text-white/40" />
                  </div>
                )}
              </div>
            </div>

            {/* Carousel Navigation Dots & Controls (When multiple banners active) */}
            {banners.length > 1 && (
              <div className="relative z-20 mt-6 pt-4 border-t border-white/15 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {banners.map((b, idx) => (
                    <button
                      key={b._id || idx}
                      onClick={() => setCurrentBannerIndex(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === currentBannerIndex
                          ? 'w-8 bg-amber-400 shadow-sm'
                          : 'w-2 bg-white/40 hover:bg-white/70'
                      }`}
                      title={b.title}
                    />
                  ))}
                  <span className="ml-2 text-[11px] text-white/70 font-medium">
                    Scheduled Promo {currentBannerIndex + 1} of {banners.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)
                    }
                    className="p-1.5 rounded-full bg-white/15 hover:bg-white/30 text-white text-xs transition-colors cursor-pointer"
                    title="Previous banner"
                  >
                    <LeftOutlined />
                  </button>
                  <button
                    onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length)}
                    className="p-1.5 rounded-full bg-white/15 hover:bg-white/30 text-white text-xs transition-colors cursor-pointer"
                    title="Next banner"
                  >
                    <RightOutlined />
                  </button>
                </div>
              </div>
            )}
          </section>
        );
      })()}

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
                ? 'bg-[#0096C7] text-white shadow-sm'
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
          <CardSkeleton count={8} columns={4} />
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
                      <div className="flex items-center justify-between gap-1 text-xs mb-1">
                        <div className="flex items-center gap-1 text-amber-500 font-semibold">
                          <StarFilled />
                          <span>{p.rating || 5.0}</span>
                          <span className="text-slate-400 text-[10px]">({p.numReviews || 0})</span>
                        </div>
                        {p.brand && (
                          <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 uppercase tracking-wider">
                            {p.brand}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-[#0284c7] transition-colors line-clamp-1">
                        {p.name}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {p.description}
                      </p>
                      {p.tags && p.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          {p.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                          {p.tags.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              +{p.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
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
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                    <StarFilled />
                    <span>{quickViewProduct.rating} / 5.0 Rating</span>
                  </div>
                  {quickViewProduct.brand && (
                    <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 uppercase tracking-wider">
                      {quickViewProduct.brand}
                    </span>
                  )}
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

                {quickViewProduct.tags && quickViewProduct.tags.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Product Tags & Classifications:
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {quickViewProduct.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-0.5 rounded-full font-semibold"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

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
