import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
  CarOutlined,
  LockOutlined,
  StarFilled,
  PlusOutlined,
  MinusOutlined,
  ShareAltOutlined,
  ThunderboltFilled,
  MessageOutlined,
  CheckOutlined,
  FireOutlined,
  RollbackOutlined,
  HeartOutlined,
  HeartFilled,
  EnvironmentOutlined,
  InfoCircleOutlined,
  DollarCircleOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Rate, Tag, Spin, Form, Input, Breadcrumb, Tooltip } from 'antd';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { ecommerceService } from '../../services/EcommerceAPIService';
import { Product } from '../../types/ecommerce.types';
import { AppButton, AppModal } from 'shared-components';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  // Variation & User interaction states
  const [selectedVariation, setSelectedVariation] = useState<string>('Standard');
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [deliveryLocation, setDeliveryLocation] = useState<string>(
    'Bagmati, Kathmandu Metro 22 - Newroad Area, Newroad'
  );
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [tempLocation, setTempLocation] = useState<string>('');

  // Seller Chat state
  const [isChatModalOpen, setIsChatModalOpen] = useState<boolean>(false);
  const [chatMessage, setChatMessage] = useState<string>('');

  // Review Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewForm] = Form.useForm();

  // Load product
  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const loadData = async () => {
      try {
        const res = await ecommerceService.getProduct(id);
        if (res.success && res.data && isMounted) {
          const p = res.data;
          setProduct(p);
          setSelectedImage(p.images?.[0] || '');

          // Load related products from same category or general catalog
          const catId = typeof p.category === 'object' ? (p.category?._id || p.category?.id) : p.category;
          const relatedRes = await ecommerceService.getProducts(catId ? { category: catId, limit: 8 } : { limit: 8 });
          if (relatedRes.success && relatedRes.data && isMounted) {
            setRelatedProducts(
              relatedRes.data.products.filter((item) => (item._id || item.id) !== (p._id || p.id)).slice(0, 4)
            );
          }

          // Load reviews for this product
          const revRes = await ecommerceService.getReviews({ product: p._id || p.id });
          if (revRes.success && revRes.data && isMounted) {
            setReviews(revRes.data);
          }
        } else if (isMounted) {
          showToast('Product not found', 'error');
        }
      } catch (err: any) {
        if (isMounted) {
          showToast(err.response?.data?.messages?.[0] || 'Failed to load product details', 'error');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleAddToCart = (openDrawer = false) => {
    if (!product) return;
    if (product.stock <= 0) {
      showToast('This product is currently out of stock', 'error');
      return;
    }
    addToCart(product, quantity);
    showToast(`Added ${quantity} × ${product.name} to your bag`, 'success');
    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (product.stock <= 0) {
      showToast('This product is currently out of stock', 'error');
      return;
    }
    addToCart(product, quantity);
    navigate('/checkout');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Product link copied to clipboard!', 'success');
  };

  const handleSubmitReview = async () => {
    if (!product) return;
    const productId = (product._id || product.id) as string;
    try {
      const values = await reviewForm.validateFields();
      setSubmittingReview(true);
      const res = await ecommerceService.createReview({
        productId,
        rating: values.rating,
        title: values.title,
        comment: values.comment,
        userName: values.userName,
        userEmail: values.userEmail,
      });

      if (res.success) {
        showToast('Thank you! Your verified review has been submitted.', 'success');
        setIsReviewModalOpen(false);
        reviewForm.resetFields();
        // Refresh reviews
        const revRes = await ecommerceService.getReviews({ product: productId });
        if (revRes.success && revRes.data) {
          setReviews(revRes.data);
        }
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

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <Spin size="large" />
        <p className="mt-4 text-sm font-semibold text-slate-500">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-3xl mb-4">
          <ShoppingOutlined />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Product Not Found</h2>
        <p className="text-slate-500 text-sm mb-6 max-w-md">
          The item you are looking for may have been retired, sold out, or moved.
        </p>
        <Link to="/">
          <AppButton type="primary" icon={<ArrowLeftOutlined />} style={{ backgroundColor: '#0284c7' }}>
            Back to Storefront
          </AppButton>
        </Link>
      </div>
    );
  }

  const categoryName = typeof product.category === 'object' ? product.category?.name : 'Collection';
  const effectivePrice = product.salePrice ?? product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;
  const isOutOfStock = product.stock <= 0;

  const displayImages = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'];

  const variationOptions = product.tags && product.tags.length > 0
    ? product.tags.slice(0, 4)
    : ['Multicolor', 'Matte Black', 'Classic Silver'];

  const sellerName =
    typeof product.seller === 'object' && product.seller
      ? `${product.seller.firstName || ''} ${product.seller.lastName || ''}`.trim() || 'Himalaya Artisan Direct'
      : product.brand || 'Himalaya Official Store';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      {/* Top Breadcrumb & Back Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
        <Breadcrumb
          items={[
            {
              title: (
                <Link to="/" className="text-slate-500 hover:text-[#0096C7] font-medium text-xs">
                  Storefront
                </Link>
              ),
            },
            {
              title: <span className="text-slate-500 font-medium text-xs">{categoryName}</span>,
            },
            {
              title: <span className="text-slate-500 font-medium text-xs">{product.brand || 'Artisan Direct'}</span>,
            },
            {
              title: (
                <span className="text-slate-800 font-bold text-xs truncate max-w-[200px] sm:max-w-xs">
                  {product.name}
                </span>
              ),
            },
          ]}
        />

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0096C7] transition-colors"
        >
          <ArrowLeftOutlined />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Main Product Showcase Grid: 3-Column Marketplace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
        {/* ================= COLUMN 1: Image Gallery (Col 4) ================= */}
        <div className="lg:col-span-4 space-y-3.5">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/80 shadow-xs group">
            <img
              src={selectedImage || displayImages[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Badges Overlay */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
              {hasDiscount && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-black uppercase tracking-wider shadow-md">
                  <FireOutlined /> {discountPercent}% OFF
                </span>
              )}
              {product.isFeatured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[11px] font-bold uppercase tracking-wider shadow-md">
                  <StarFilled /> Featured Pick
                </span>
              )}
            </div>

          </div>

          {/* Thumbnails Row with Arrows */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={displayImages.length <= 1}
              onClick={() => {
                const currentIndex = displayImages.indexOf(selectedImage || displayImages[0]);
                const prevIndex = (currentIndex - 1 + displayImages.length) % displayImages.length;
                setSelectedImage(displayImages[prevIndex]);
              }}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
              title="Previous image"
            >
              <LeftOutlined className="text-xs" />
            </button>

            <div className="flex items-center gap-2 overflow-x-auto py-1 flex-1">
              {displayImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 bg-slate-50 ${
                    (selectedImage || displayImages[0]) === imgUrl
                      ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={displayImages.length <= 1}
              onClick={() => {
                const currentIndex = displayImages.indexOf(selectedImage || displayImages[0]);
                const nextIndex = (currentIndex + 1) % displayImages.length;
                setSelectedImage(displayImages[nextIndex]);
              }}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
              title="Next image"
            >
              <RightOutlined className="text-xs" />
            </button>
          </div>
        </div>

        {/* ================= COLUMN 2: Product Core Info & Actions (Col 5) ================= */}
        <div className="lg:col-span-5 space-y-4">
          {/* Title Header with Wishlist & Share */}
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            <div className="flex items-center gap-1.5 shrink-0 pt-1">
              <button
                onClick={handleCopyLink}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                title="Share Product"
              >
                <ShareAltOutlined className="text-sm" />
              </button>
              <button
                onClick={() => {
                  setIsWishlisted(!isWishlisted);
                  showToast(
                    isWishlisted ? 'Removed from Wishlist' : 'Saved to Wishlist ❤️',
                    'success'
                  );
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isWishlisted
                    ? 'bg-rose-50 text-rose-500 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-rose-500'
                }`}
                title="Save to Wishlist"
              >
                {isWishlisted ? (
                  <HeartFilled className="text-sm text-rose-500" />
                ) : (
                  <HeartOutlined className="text-sm" />
                )}
              </button>
            </div>
          </div>

          {/* Rating, Reviews count & Brand links */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <Rate
                disabled
                allowHalf
                value={product.rating || 5}
                className="text-amber-400 text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('customer-reviews');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[#0096C7] hover:underline font-semibold cursor-pointer"
              >
                Ratings {reviews.length || product.numReviews || 8}
              </button>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">SKU: {product.sku || 'N/A'}</span>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
              <span>Brand:</span>
              <span className="font-bold text-[#0096C7] hover:underline cursor-pointer">
                {product.brand || 'Authentic Himalayan'}
              </span>
              <span className="text-slate-300">|</span>
              <span>More from {categoryName}</span>
            </div>
          </div>

          {/* Promotional Deal Banner (e.g. Flash Deal / Special Promo) */}
          <div className="w-full rounded-xl bg-gradient-to-r from-purple-900 via-indigo-900 to-rose-900 text-white py-2 px-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                SHOP NOW!
              </span>
              <span className="font-bold text-xs uppercase tracking-wide text-amber-200">
                Exclusive Online Sale
              </span>
            </div>
            <span className="text-[11px] font-black text-rose-200 uppercase tracking-wider">
              {hasDiscount ? `SAVE ${discountPercent}%` : 'LIMITED DEALS'}
            </span>
          </div>

          {/* Price Block */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-black text-rose-600">
                ${effectivePrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-sm text-slate-400 line-through font-semibold">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>
            {hasDiscount && (
              <p className="text-[11px] text-emerald-700 font-medium">
                You save ${(product.price - product.salePrice!).toFixed(2)} off original price
              </p>
            )}
          </div>

          {/* Variation / Color Family */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Color Family / Edition:</span>
              <span className="font-bold text-slate-900">{selectedVariation}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {variationOptions.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSelectedVariation(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer relative flex items-center gap-1.5 ${
                    selectedVariation === v
                      ? 'border-amber-500 bg-amber-50/70 text-slate-950 ring-2 ring-amber-500/20 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{v}</span>
                  {selectedVariation === v && (
                    <CheckOutlined className="text-[10px] text-amber-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Stepper */}
          <div className="flex items-center gap-4 pt-1">
            <span className="text-xs text-slate-500 font-medium">Quantity</span>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <button
                type="button"
                disabled={quantity <= 1 || isOutOfStock}
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <MinusOutlined className="text-xs" />
              </button>
              <span className="px-3.5 py-1.5 font-bold text-slate-900 text-xs select-none min-w-[28px] text-center">
                {quantity}
              </span>
              <button
                type="button"
                disabled={quantity >= product.stock || isOutOfStock}
                onClick={() => setQuantity((prev) => Math.min(product.stock, prev + 1))}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <PlusOutlined className="text-xs" />
              </button>
            </div>
            <span className="text-[11px] text-slate-400">
              {isOutOfStock ? (
                <span className="text-rose-500 font-semibold">Out of Stock</span>
              ) : (
                `${product.stock} items available`
              )}
            </span>
          </div>

          {/* Dual Action CTAs: Buy Now (Cyan) & Add to Cart (Orange) */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleBuyNow}
              className="w-full py-3.5 px-4 rounded-xl bg-[#00a8e8] hover:bg-[#0096c7] active:scale-[0.98] text-white font-extrabold text-sm transition-all shadow-md shadow-sky-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              <ThunderboltFilled className="text-white text-xs" />
              <span>Buy Now</span>
            </button>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => handleAddToCart(true)}
              className="w-full py-3.5 px-4 rounded-xl bg-[#f97316] hover:bg-[#ea580c] active:scale-[0.98] text-white font-extrabold text-sm transition-all shadow-md shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingOutlined className="text-base" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>

        {/* ================= COLUMN 3: Delivery, Return, QR & Seller Sidebar (Col 3) ================= */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-4 shadow-xs">
            {/* Delivery Options */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
                <span>Delivery Options</span>
                <Tooltip title="Delivery times and rates vary by region and method">
                  <InfoCircleOutlined className="cursor-pointer hover:text-slate-700" />
                </Tooltip>
              </div>

              {/* Delivery Location */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200/70">
                <div className="flex items-start gap-2 text-xs text-slate-800">
                  <EnvironmentOutlined className="text-slate-400 mt-0.5 text-sm shrink-0" />
                  <span className="leading-snug">{deliveryLocation}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTempLocation(deliveryLocation);
                    setIsLocationModalOpen(true);
                  }}
                  className="text-[#0096C7] hover:underline font-bold text-xs uppercase tracking-wider shrink-0 cursor-pointer"
                >
                  CHANGE
                </button>
              </div>

              {/* Standard Delivery */}
              <div className="flex items-start justify-between gap-2 py-3 border-b border-slate-200/70">
                <div className="flex items-start gap-2.5">
                  <CarOutlined className="text-slate-400 mt-0.5 text-base shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Standard Delivery</div>
                    <div className="text-[11px] text-slate-500">Guaranteed in 2-3 days</div>
                  </div>
                </div>
                <div className="text-xs font-extrabold text-slate-900">
                  {effectivePrice >= 150 ? 'FREE' : '$5.00'}
                </div>
              </div>

              {/* Cash on Delivery */}
              <div className="flex items-center gap-2.5 pt-3">
                <DollarCircleOutlined className="text-slate-400 text-base shrink-0" />
                <span className="text-xs font-semibold text-slate-800">
                  Cash on Delivery Available
                </span>
              </div>
            </div>

            {/* Return & Warranty */}
            <div className="pt-3 border-t border-slate-200/70">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
                <span>Return & Warranty</span>
                <Tooltip title="Satisfaction guarantee and authenticity warranty">
                  <InfoCircleOutlined className="cursor-pointer hover:text-slate-700" />
                </Tooltip>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <RollbackOutlined className="text-slate-400 text-base shrink-0" />
                  <span className="text-xs font-semibold text-slate-800">
                    14 Days Free Returns
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <SafetyCertificateOutlined className="text-slate-400 text-base shrink-0" />
                  <span className="text-xs font-semibold text-slate-800">
                    100% Authentic Guarantee
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sold by / Seller Card */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Sold by
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Verified Store
              </span>
            </div>

            <div className="text-xs font-black text-slate-900 truncate">{sellerName}</div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <span>Positive Ratings</span>
              <span className="font-extrabold text-slate-900">97%</span>
            </div>

            <button
              type="button"
              onClick={() => setIsChatModalOpen(true)}
              className="w-full mt-1 py-1.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0096C7] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-sky-100 cursor-pointer"
            >
              <MessageOutlined />
              <span>Chat with Seller</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. PRODUCT SPECIFICATIONS (AT THE TOP) */}
      <section id="product-specifications" className="border border-slate-200/80 rounded-3xl bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
          <span className="w-1.5 h-5 bg-[#0096C7] rounded-full" />
          <h3 className="text-lg font-bold text-slate-900">Specifications & Technical Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs">
          <div className="flex justify-between py-2.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">SKU</span>
            <span className="text-slate-900 font-mono font-bold">{product.sku || 'N/A'}</span>
          </div>

          <div className="flex justify-between py-2.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Brand</span>
            <span className="text-slate-900 font-bold">{product.brand || 'Authentic Himalayan'}</span>
          </div>

          <div className="flex justify-between py-2.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Category</span>
            <span className="text-slate-900 font-bold">{categoryName}</span>
          </div>

          <div className="flex justify-between py-2.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Stock Status</span>
            <span className="text-slate-900 font-bold">
              {isOutOfStock ? (
                <span className="text-rose-600">Out of Stock</span>
              ) : (
                <span className="text-emerald-700">{product.stock} items available in warehouse</span>
              )}
            </span>
          </div>

          <div className="flex justify-between py-2.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Customer Rating</span>
            <span className="text-slate-900 font-bold flex items-center gap-1">
              <StarFilled className="text-amber-500 text-xs" />
              {(product.rating || 5.0).toFixed(1)} / 5.0 ({reviews.length || product.numReviews || 0} reviews)
            </span>
          </div>

          <div className="flex justify-between py-2.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Warranty</span>
            <span className="text-slate-900 font-semibold flex items-center gap-1 text-emerald-700">
              <SafetyCertificateOutlined /> 100% Authentic Guarantee
            </span>
          </div>

          <div className="flex justify-between py-2.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Returns</span>
            <span className="text-slate-900 font-semibold flex items-center gap-1 text-slate-800">
              <RollbackOutlined /> 14 Days Free Returns
            </span>
          </div>

          <div className="flex justify-between py-2.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Packaging</span>
            <span className="text-slate-900 font-semibold">Eco-Friendly Artisan Cured Box</span>
          </div>
        </div>

        {product.tags && product.tags.length > 0 && (
          <div className="pt-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-400">Features:</span>
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-medium border border-slate-200/60"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* 2. PRODUCT DESCRIPTION / OVERVIEW (IN THE MIDDLE) */}
      <section id="product-description" className="border border-slate-200/80 rounded-3xl bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
          <span className="w-1.5 h-5 bg-amber-500 rounded-full" />
          <h3 className="text-lg font-bold text-slate-900">Product Overview & Detailed Description</h3>
        </div>

        <div className="space-y-4 max-w-4xl text-slate-700 text-sm leading-relaxed">
          <p className="whitespace-pre-line text-slate-700 font-normal leading-relaxed">
            {product.description}
          </p>

          <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 text-xs text-sky-950 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-[#0096C7] text-sm">
              <CheckCircleOutlined /> Direct Artisan Sourcing & Fair Trade Promise
            </div>
            <p className="text-slate-600 leading-relaxed">
              Every piece in our catalog is rigorously verified for authentic craftsmanship, fair compensation to independent makers, and genuine Himalayan origin. By purchasing this item, you directly support certified artisan families and preserve generations of cultural heritage.
            </p>
          </div>
        </div>
      </section>

      {/* 3. CUSTOMER REVIEWS & RATINGS (FINALLY AT THE BOTTOM) */}
      <section id="customer-reviews" className="border border-slate-200/80 rounded-3xl bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Verified Customer Reviews ({reviews.length})
              </h3>
              <p className="text-xs text-slate-500">Real feedback from verified purchasers</p>
            </div>
          </div>

          <AppButton
            type="primary"
            icon={<MessageOutlined />}
            onClick={() => {
              reviewForm.setFieldsValue({ productId: product._id || product.id });
              setIsReviewModalOpen(true);
            }}
            style={{ backgroundColor: '#0284c7' }}
          >
            Write a Review
          </AppButton>
        </div>

        {/* Rating Breakdown Summary Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
          <div className="text-center sm:text-left sm:border-r sm:border-slate-200 sm:pr-8">
            <div className="text-4xl font-black text-slate-900">
              {(product.rating || 5.0).toFixed(1)}
            </div>
            <div className="text-xs text-slate-400 font-semibold">out of 5.0</div>
            <Rate disabled allowHalf value={product.rating || 5} className="text-amber-500 text-xs mt-1" />
          </div>

          <div className="text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <CheckCircleOutlined className="text-emerald-600" /> 100% Authentic Customer Feedback
            </div>
            <p className="text-slate-500">
              {reviews.length > 0
                ? `${reviews.length} buyers have shared their experience with this product.`
                : 'Be the first verified customer to leave a review!'}
            </p>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No reviews recorded yet for this item. Be the first to share your experience!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {reviews.map((rev) => (
              <div
                key={rev._id || rev.id}
                className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2.5 hover:bg-white hover:shadow-xs transition-all"
              >
                <div className="flex items-center justify-between">
                  <Rate disabled value={rev.rating} className="text-xs text-amber-500" />
                  <span className="text-[10px] text-slate-400 font-mono">
                    {rev.createdAt
                      ? new Date(rev.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : ''}
                  </span>
                </div>
                {rev.title && <h5 className="font-bold text-slate-900 text-xs">{rev.title}</h5>}
                <p className="text-xs text-slate-600 italic leading-relaxed">"{rev.comment}"</p>
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
                  <span className="font-semibold text-slate-800">{rev.userName}</span>
                  {rev.isVerifiedPurchase && (
                    <span className="text-emerald-700 font-medium text-[10px] flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircleOutlined /> Verified Buyer
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">You May Also Like</h3>
              <p className="text-xs text-slate-400">Handpicked alternatives from the {categoryName} collection</p>
            </div>
            <Link to="/" className="text-xs font-semibold text-[#0096C7] hover:underline">
              Explore All Items →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {relatedProducts.map((p) => {
              const pId = p._id || p.id;
              return (
                <div
                  key={pId}
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
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{p.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="font-extrabold text-slate-900 text-base">
                        ${(p.salePrice ?? p.price).toFixed(2)}
                      </div>
                      <span className="text-xs font-bold text-[#0096C7] group-hover:underline">View →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Review Modal */}
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
          <Form.Item name="productId" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="rating"
            label="Rating"
            rules={[{ required: true, message: 'Please select a star rating' }]}
            initialValue={5}
          >
            <Rate className="text-amber-500" />
          </Form.Item>

          <Form.Item
            name="title"
            label="Review Headline"
            rules={[{ required: true, message: 'Please enter a review summary' }]}
          >
            <Input placeholder="e.g. Stunning craftsmanship, exceeded expectations!" />
          </Form.Item>

          <Form.Item
            name="comment"
            label="Your Review Details"
            rules={[{ required: true, message: 'Please write your thoughts on this product' }]}
          >
            <Input.TextArea rows={4} placeholder="Describe the quality, touch, design, and overall satisfaction..." />
          </Form.Item>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="userName"
              label="Your Name"
              rules={[{ required: true, message: 'Please enter your display name' }]}
            >
              <Input placeholder="e.g. Jane Doe" />
            </Form.Item>

            <Form.Item
              name="userEmail"
              label="Your Email"
              rules={[{ type: 'email', message: 'Valid email required' }]}
            >
              <Input placeholder="jane@example.com (optional)" />
            </Form.Item>
          </div>
        </Form>
      </AppModal>

      {/* Change Delivery Location Modal */}
      <AppModal
        open={isLocationModalOpen}
        onCancel={() => setIsLocationModalOpen(false)}
        title="Change Delivery Destination"
        width={480}
        footer={[
          <AppButton key="cancel" onClick={() => setIsLocationModalOpen(false)}>
            Cancel
          </AppButton>,
          <AppButton
            key="save"
            type="primary"
            style={{ backgroundColor: '#0284c7' }}
            onClick={() => {
              if (tempLocation.trim()) {
                setDeliveryLocation(tempLocation.trim());
                showToast('Delivery address updated', 'success');
              }
              setIsLocationModalOpen(false);
            }}
          >
            Save Location
          </AppButton>,
        ]}
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-slate-500">
            Enter your region, city, or neighborhood to view accurate delivery rates and estimated delivery windows:
          </p>
          <Input
            value={tempLocation}
            onChange={(e) => setTempLocation(e.target.value)}
            placeholder="e.g. Bagmati, Kathmandu Metro 22 - Newroad Area"
            prefix={<EnvironmentOutlined className="text-slate-400" />}
            className="py-2 rounded-xl"
          />
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-[11px] font-semibold text-slate-400">Popular regions:</span>
            {['Kathmandu Newroad', 'Lalitpur Pulchowk', 'Pokhara Lakeside', 'Bhaktapur Durbar'].map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setTempLocation(`Bagmati, ${city}`)}
                className="text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </AppModal>

      {/* Seller Chat Modal */}
      <AppModal
        open={isChatModalOpen}
        onCancel={() => {
          setIsChatModalOpen(false);
          setChatMessage('');
        }}
        title={`Chat with ${sellerName}`}
        width={500}
        footer={[
          <AppButton
            key="cancel"
            onClick={() => {
              setIsChatModalOpen(false);
              setChatMessage('');
            }}
          >
            Close
          </AppButton>,
          <AppButton
            key="send"
            type="primary"
            style={{ backgroundColor: '#0284c7' }}
            disabled={!chatMessage.trim()}
            onClick={() => {
              showToast(`Your message has been sent to ${sellerName}! They usually reply within 1 hour.`, 'success');
              setIsChatModalOpen(false);
              setChatMessage('');
            }}
          >
            Send Message
          </AppButton>,
        ]}
      >
        <div className="space-y-3 py-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="w-10 h-10 rounded-full bg-sky-100 text-[#0096C7] flex items-center justify-center font-bold text-sm">
              {sellerName.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">{sellerName}</div>
              <div className="text-[11px] text-emerald-600 font-semibold">● Typically replies in under 1 hour</div>
            </div>
          </div>

          <div className="text-xs font-medium text-slate-600">Inquiring about:</div>
          <div className="text-xs font-bold text-slate-800 bg-slate-100/70 p-2.5 rounded-lg border border-slate-200/50 truncate">
            {product.name}
          </div>

          <Input.TextArea
            rows={4}
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Ask about dimensions, authenticity, customization, or shipping..."
            className="rounded-xl"
          />
        </div>
      </AppModal>
    </div>
  );
};

export default ProductDetailPage;
