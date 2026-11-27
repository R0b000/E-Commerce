import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShoppingOutlined,
  StarFilled,
  SearchOutlined,
  ThunderboltFilled,
  ThunderboltOutlined,
  PlusOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  LeftOutlined,
  RightOutlined,
  ClockCircleOutlined,
  QrcodeOutlined,
  FireOutlined,
  ArrowRightOutlined,
  AppstoreOutlined,
  CopyOutlined,
  GiftOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Tag, Spin, Input, Rate, Form, Select } from 'antd';
import { ecommerceService } from '../../services/EcommerceAPIService';
import { Product, Category, BannerItem } from '../../types/ecommerce.types';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { AppCard, AppButton, AppModal, CardSkeleton } from 'shared-components';
import { ProductQrModal } from '../admin/products/ProductQrModal';

export const StoreHomePage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [qrModalProduct, setQrModalProduct] = useState<Product | null>(null);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const [searchParams] = useSearchParams();
  const productParam = searchParams.get('product') || searchParams.get('viewProduct');

  const { addToCart } = useCart();
  const { showToast } = useToast();

  // Daraz-style Flash Sale real-time Countdown Timer
  const [flashTime, setFlashTime] = useState({
    hours: 5,
    minutes: 42,
    seconds: 18,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setFlashTime((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 12, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Daraz-style Flash Sale Deals
  const flashSaleProducts = useMemo(() => {
    if (!products.length) return [];
    const withSale = products.filter((p) => p.salePrice && p.salePrice < p.price);
    const standard = products.filter((p) => !p.salePrice || p.salePrice >= p.price);
    const pool = [...withSale, ...standard].slice(0, 6);

    return pool.map((p, idx) => {
      const regularPrice = p.price;
      const finalSalePrice =
        p.salePrice && p.salePrice < regularPrice
          ? p.salePrice
          : Math.round(regularPrice * 0.72 * 100) / 100;
      const discountPercent = Math.max(
        15,
        Math.round(((regularPrice - finalSalePrice) / regularPrice) * 100)
      );
      const itemsSold = 10 + ((idx * 7) % 25);
      const itemsLeft = Math.max(2, (p.stock || 25) - itemsSold);
      const percentSold = Math.min(92, Math.round((itemsSold / (itemsSold + itemsLeft)) * 100));

      return {
        ...p,
        finalSalePrice,
        discountPercent,
        itemsSold,
        itemsLeft,
        percentSold,
      };
    });
  }, [products]);

  // Curate top 2-3 trending categories with active products & counts
  const trendingCategories = useMemo(() => {
    if (!categories.length || !products.length) return [];
    const countMap: Record<string, { count: number; products: Product[] }> = {};
    products.forEach((p) => {
      const catId = typeof p.category === 'object' ? (p.category?._id || p.category?.id) : p.category;
      if (!catId) return;
      if (!countMap[catId]) {
        countMap[catId] = { count: 0, products: [] };
      }
      countMap[catId].count += 1;
      countMap[catId].products.push(p);
    });

    return categories
      .map((cat) => {
        const catId = (cat._id || cat.id || '') as string;
        const info = countMap[catId] || { count: 0, products: [] };
        return {
          ...cat,
          productCount: info.count,
          topProducts: info.products.slice(0, 4),
        };
      })
      .filter((cat) => cat.productCount > 0)
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, 3);
  }, [categories, products]);

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
      } catch {
        showToast('Failed to load store catalog', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Direct Product QR scan listener (?product=... or ?viewProduct=...)
  useEffect(() => {
    if (!productParam) return;
    const match = products.find(
      (p) =>
        (p._id && p._id.toString() === productParam) ||
        (p.id && p.id.toString() === productParam) ||
        (p.sku && p.sku.toLowerCase() === productParam.toLowerCase())
    );
    if (match) {
      navigate(`/product/${match._id || match.id}`);
    } else if (!loading) {
      ecommerceService
        .getProduct(productParam)
        .then((res) => {
          if (res.success && res.data) {
            navigate(`/product/${res.data._id || res.data.id}`);
          }
        })
        .catch(() => {});
    }
  }, [productParam, products, loading]);

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

  const featuredProduct = products.find((p) => p.isFeatured) || products[0];

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    addToCart(product, 1);
    showToast(`Added ${product.name} to your bag`, 'success');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 py-8 font-['Nunito_Sans','Poppins',sans-serif]">
      {/* Hero Banner Section (Original Padded Rounded-3xl Card) */}
      {(() => {
        if (loading) {
          return (
            <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0369a1] via-[#0096c7] to-[#0284c7] text-white p-8 md:p-12 lg:p-16 shadow-xl border border-sky-400/20 animate-pulse">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-5">
                  <div className="w-48 h-7 rounded-full bg-white/20" />
                  <div className="space-y-3">
                    <div className="w-3/4 h-10 bg-white/25 rounded-2xl" />
                    <div className="w-full h-10 bg-white/25 rounded-2xl" />
                  </div>
                  <div className="w-full h-12 bg-white/15 rounded-xl" />
                  <div className="pt-2 flex gap-3">
                    <div className="w-36 h-10 rounded-xl bg-white/30" />
                    <div className="w-32 h-10 rounded-xl bg-white/20" />
                  </div>
                </div>
                <div className="lg:col-span-5 flex justify-center lg:justify-end">
                  <div className="w-full max-w-sm bg-white/15 rounded-3xl p-4 h-64" />
                </div>
              </div>
            </section>
          );
        }

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
                  <Link
                    to="/products"
                    className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] font-bold text-xs uppercase tracking-wider text-slate-950 transition-all shadow-lg shadow-amber-500/25 cursor-pointer flex items-center gap-2"
                  >
                    <span>{currentBanner?.ctaText || 'Shop All Catalog'}</span>
                    <span className="text-sm">→</span>
                  </Link>

                  {(currentBanner?.secondaryCtaText || !currentBanner) && (
                    <button
                      onClick={() => {
                        const el = document.getElementById('trending-sections');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs uppercase tracking-wider backdrop-blur-md transition-all border border-white/30 cursor-pointer"
                    >
                      {currentBanner?.secondaryCtaText || 'Trending Departments'}
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
                    onClick={() => navigate(`/product/${featuredProduct._id || featuredProduct.id}`)}
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
                ) : null}
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

      <div id="trending-sections" className="space-y-12">
        {/* Daraz-Style Flash Sale Section */}
        <section id="flash-sale-section" className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
            {/* Left: Title & Live Countdown Timer */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 text-rose-600 font-black text-xl sm:text-2xl tracking-tight">
                <ThunderboltFilled className="text-amber-500 text-2xl" />
                <span>Flash Sale</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-600">Ending in</span>
                <div className="flex items-center gap-1 font-mono font-black text-white">
                  <span className="bg-slate-900 px-1.5 py-0.5 rounded text-xs min-w-[22px] text-center">
                    {String(flashTime.hours).padStart(2, '0')}
                  </span>
                  <span className="text-slate-800 font-bold">:</span>
                  <span className="bg-slate-900 px-1.5 py-0.5 rounded text-xs min-w-[22px] text-center">
                    {String(flashTime.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-slate-800 font-bold">:</span>
                  <span className="bg-rose-600 px-1.5 py-0.5 rounded text-xs min-w-[22px] text-center">
                    {String(flashTime.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Shop More Link */}
            <button
              onClick={() => {
                const el = document.getElementById('catalog-grid');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs sm:text-sm font-extrabold text-[#0284c7] hover:text-sky-700 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>SHOP MORE DEALS</span>
              <ArrowRightOutlined className="text-xs" />
            </button>
          </div>

          {/* Flash Sale Cards Grid (6 Items) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {flashSaleProducts.map((p) => {
              const pId = p._id || p.id;
              return (
                <div
                  key={`flash-${pId}`}
                  onClick={() => navigate(`/product/${pId}`)}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col justify-between"
                >
                  <div className="aspect-square bg-slate-100 overflow-hidden relative">
                    <img
                      src={
                        p.images?.[0] ||
                        'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80'
                      }
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Discount Badge */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                      -{p.discountPercent}%
                    </div>
                  </div>

                  <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs group-hover:text-rose-600 transition-colors line-clamp-2 leading-snug">
                        {p.name}
                      </h4>

                      <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
                        <span className="font-black text-rose-600 text-sm sm:text-base">
                          ${p.finalSalePrice.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 line-through">
                          ${p.price.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      {/* Urgency Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 mb-0.5">
                          <span>{p.itemsSold} Sold</span>
                          <span className="text-rose-600">{p.itemsLeft} Left</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-rose-600 rounded-full"
                            style={{ width: `${p.percentSold}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleAddToCart(p, e)}
                        className="w-full py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-extrabold text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1 border border-rose-200"
                      >
                        <ShoppingOutlined /> Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        {/* Trending Categories Spotlight (Top 2-3 Departments) */}
        {loading ? (
          <section className="space-y-6 animate-pulse">
            <div className="space-y-2">
              <div className="w-40 h-6 rounded-full bg-slate-200" />
              <div className="w-72 h-8 rounded-xl bg-slate-200" />
              <div className="w-96 h-4 rounded bg-slate-200" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-16/10 sm:aspect-4/3 rounded-3xl bg-slate-200/80 p-6 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-24 h-6 rounded-full bg-slate-300" />
                    <div className="w-16 h-5 rounded-full bg-slate-300" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-3/4 h-6 rounded-lg bg-slate-300" />
                    <div className="w-full h-4 rounded bg-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : trendingCategories.length > 0 && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-600 text-xs font-bold uppercase tracking-wider mb-2">
                  <FireOutlined className="text-rose-500" />
                  <span>Trending Collections</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Most Popular Departments
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Explore our highest-rated categories handpicked by verified shoppers.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {trendingCategories.length} Trending Collections
              </span>
            </div>

            {/* 3 Trending Category Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {trendingCategories.map((cat, idx) => {
                const cId = (cat._id || cat.id || '') as string;
                const catImg =
                  cat.image ||
                  cat.topProducts[0]?.images?.[0] ||
                  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80';
                const rankBadges = ['🔥 #1 Trending', '✨ #2 Most Loved', '⚡ #3 Best Seller'];

                return (
                  <div
                    key={`trending-card-${cId}`}
                    onClick={() => {
                      navigate(`/products?category=${cId}`);
                    }}
                    className="relative rounded-3xl overflow-hidden aspect-16/10 sm:aspect-4/3 group cursor-pointer shadow-md hover:shadow-2xl transition-all duration-500 border border-slate-200/60"
                  >
                    <img
                      src={catImg}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent transition-opacity duration-300 group-hover:from-slate-950" />

                    <div className="absolute inset-0 p-6 flex flex-col justify-between text-white z-10">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-amber-300 border border-white/20">
                          {rankBadges[idx] || 'Trending'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-black/40 text-[11px] font-semibold text-sky-200 backdrop-blur-sm">
                          {cat.productCount} Items
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-xl font-black text-white group-hover:text-amber-300 transition-colors">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {cat.description || `Handcrafted premium products in ${cat.name}.`}
                        </p>
                        <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                          <span>Explore Department</span>
                          <ArrowRightOutlined className="text-xs" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Curated Product Shelves for the Top Trending Categories */}
        {trendingCategories.map((cat) => {
          const cId = (cat._id || cat.id || '') as string;
          return (
            <section key={`shelf-${cId}`} className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0096C7] flex items-center justify-center font-bold text-sm shrink-0 border border-sky-100">
                    <AppstoreOutlined />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{cat.name}</h3>
                    <p className="text-xs text-slate-500">
                      {cat.description || `Top verified selections in ${cat.name}`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    navigate(`/products?category=${cId}`);
                  }}
                  className="text-xs font-bold text-[#0096C7] hover:text-sky-700 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <span>View All in {cat.name} ({cat.productCount})</span>
                  <ArrowRightOutlined className="text-[10px]" />
                </button>
              </div>

              {/* 4 Products in this Trending Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {cat.topProducts.map((p) => {
                  const pId = p._id || p.id;
                  return (
                    <div
                      key={`top-${pId}`}
                      onClick={() => navigate(`/product/${pId}`)}
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
                              <span>{(p.rating || 5.0).toFixed(1)}</span>
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
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <div className="font-extrabold text-slate-900 text-base">
                              ${(p.salePrice ?? p.price).toFixed(2)}
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
            </section>
          );
        })}

        {/* Full Catalog Direct Link Banner */}
        <section className="mt-8 rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-slate-800 p-8 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold uppercase tracking-wider border border-sky-400/30">
              <AppstoreOutlined />
              <span>Explore Complete Collection</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Looking for something specific?
            </h3>
            <p className="text-sky-200 text-xs sm:text-sm max-w-xl">
              Browse our full catalog organized category-wise with instant search, price filters, and artisan collections.
            </p>
          </div>

          <Link
            to="/products"
            className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-105 active:scale-[0.98] text-slate-950 font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2.5 shrink-0"
          >
            <span>Browse All Categories</span>
            <ArrowRightOutlined />
          </Link>
        </section>
      </div>

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

              <div className="pt-4 border-t border-slate-200 flex items-center gap-2">
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
                <AppButton
                  size="large"
                  icon={<QrcodeOutlined />}
                  onClick={() => setQrModalProduct(quickViewProduct)}
                  title="Marketing & Advertisement QR Codes"
                >
                  QR Code
                </AppButton>
              </div>
            </div>
          </div>
        </AppModal>
      )}

      {/* Product Marketing & Advertisement QR Hub */}
      <ProductQrModal
        product={qrModalProduct}
        open={Boolean(qrModalProduct)}
        onClose={() => setQrModalProduct(null)}
      />
    </div>
  );
};

export default StoreHomePage;
