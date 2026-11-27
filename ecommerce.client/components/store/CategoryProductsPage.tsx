import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
  ShoppingOutlined,
  StarFilled,
  SearchOutlined,
  PlusOutlined,
  AppstoreOutlined,
  ArrowLeftOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  ThunderboltFilled,
  CloseCircleOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { Input, Select, Tag, Spin, Empty } from 'antd';
import { ecommerceService } from '../../services/EcommerceAPIService';
import { Product, Category } from '../../types/ecommerce.types';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { AppButton, CardSkeleton } from 'shared-components';

export const CategoryProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { categoryId: paramCategoryId } = useParams<{ categoryId?: string }>();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Category & Search
  const queryCategory = searchParams.get('category') || paramCategoryId || 'all';
  const querySearch = searchParams.get('q') || searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState<string>(queryCategory);
  const [searchQuery, setSearchQuery] = useState<string>(querySearch);
  const [sortBy, setSortBy] = useState<string>('featured');

  const { addToCart } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    if (queryCategory !== selectedCategory) {
      setSelectedCategory(queryCategory);
    }
  }, [queryCategory]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          ecommerceService.getProducts({ limit: 100, status: 'active' }),
          ecommerceService.getCategories(),
        ]);
        if (prodRes.success && prodRes.data) {
          setProducts(prodRes.data.products);
        }
        if (catRes.success && catRes.data) {
          setCategories(catRes.data);
        }
      } catch {
        showToast('Failed to load category catalog', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    addToCart(product, 1);
    showToast(`Added ${product.name} to your bag`, 'success');
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    const newParams = new URLSearchParams(searchParams);
    if (catId === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', catId);
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const newParams = new URLSearchParams(searchParams);
    if (value.trim()) {
      newParams.set('q', value.trim());
    } else {
      newParams.delete('q');
    }
    setSearchParams(newParams);
  };

  // Map category IDs to category objects
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => {
      const id = (c._id || c.id || '') as string;
      map.set(id, c);
    });
    return map;
  }, [categories]);

  // Compute product counts per category
  const categoryCountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const catId = typeof p.category === 'object' ? (p.category?._id || p.category?.id) : p.category;
      if (catId) {
        counts[catId] = (counts[catId] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        (p.brand && p.brand.toLowerCase().includes(query)) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(query))) ||
        (p.sku && p.sku.toLowerCase().includes(query));

      const catId = typeof p.category === 'object' ? (p.category?._id || p.category?.id) : p.category;
      const matchesCategory = selectedCategory === 'all' || catId === selectedCategory;

      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      if (sortBy === 'price-low') {
        const pA = a.salePrice ?? a.price;
        const pB = b.salePrice ?? b.price;
        return pA - pB;
      }
      if (sortBy === 'price-high') {
        const pA = a.salePrice ?? a.price;
        const pB = b.salePrice ?? b.price;
        return pB - pA;
      }
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }, [products, searchQuery, selectedCategory, sortBy]);

  // Group filtered products by Category for structured rendering
  const categoryGroupedProducts = useMemo(() => {
    const groups: { category: Category; items: Product[] }[] = [];
    const groupedMap = new Map<string, Product[]>();

    filteredProducts.forEach((p) => {
      const catId = (typeof p.category === 'object' ? (p.category?._id || p.category?.id) : p.category) || 'uncategorized';
      if (!groupedMap.has(catId)) {
        groupedMap.set(catId, []);
      }
      groupedMap.get(catId)!.push(p);
    });

    categories.forEach((cat) => {
      const cId = (cat._id || cat.id || '') as string;
      const items = groupedMap.get(cId);
      if (items && items.length > 0) {
        groups.push({ category: cat, items });
      }
    });

    // Add any uncategorized items if present
    const uncatItems = groupedMap.get('uncategorized');
    if (uncatItems && uncatItems.length > 0) {
      groups.push({
        category: {
          _id: 'uncategorized',
          name: 'Other Artisan Goods',
          slug: 'other',
          description: 'Unique verified handcrafted items',
          isActive: true,
          displayOrder: 999,
        },
        items: uncatItems,
      });
    }

    return groups;
  }, [filteredProducts, categories]);

  const activeCategoryObj = useMemo(() => {
    if (selectedCategory === 'all') return null;
    return categoryMap.get(selectedCategory) || null;
  }, [selectedCategory, categoryMap]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-['Nunito_Sans','Poppins',sans-serif]">
      {/* Breadcrumb & Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
            <Link to="/" className="hover:text-sky-600 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-slate-800 font-bold">Catalog</span>
            {activeCategoryObj && (
              <>
                <span>/</span>
                <span className="text-sky-600 font-bold">{activeCategoryObj.name}</span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>{activeCategoryObj ? activeCategoryObj.name : 'Category Catalog'}</span>
            <span className="text-xs sm:text-sm font-bold px-3 py-1 bg-sky-50 text-sky-700 rounded-full border border-sky-200">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'} Available
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-medium">
            {activeCategoryObj?.description ||
              'Explore our collection arranged by category. Filter by department or search directly by title, artisan brand, and materials.'}
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-sky-600 transition-colors self-start sm:self-auto bg-slate-100 hover:bg-slate-200/80 px-4 py-2.5 rounded-xl"
        >
          <ArrowLeftOutlined />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Search & Sort Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Real-time Search Input */}
          <div className="md:col-span-8 relative">
            <Input
              size="large"
              prefix={<SearchOutlined className="text-sky-600 mr-1.5 text-base" />}
              placeholder="Search products by title, artisan brand, material, description..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              allowClear
              className="rounded-xl border-slate-200 text-sm font-semibold shadow-xs"
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="md:col-span-4 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Sort by:</span>
            <Select
              size="large"
              value={sortBy}
              onChange={setSortBy}
              className="w-full text-xs font-bold"
              options={[
                { value: 'featured', label: '⭐ Featured & Staff Picks' },
                { value: 'price-low', label: '💵 Price: Low to High' },
                { value: 'price-high', label: '💎 Price: High to Low' },
                { value: 'rating', label: '★ Highest Rated' },
                { value: 'newest', label: '🕒 Newest Additions' },
              ]}
            />
          </div>
        </div>

        {/* Category Filter Pills Bar */}
        <div className="pt-3 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <FilterOutlined className="text-sky-600" />
            <span>Select Department / Category:</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {/* All Categories Pill */}
            <button
              onClick={() => handleCategoryChange('all')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
              }`}
            >
              <AppstoreOutlined />
              <span>All Categories</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
              }`}>
                {products.length}
              </span>
            </button>

            {/* Individual Category Pills */}
            {categories.map((cat) => {
              const cId = (cat._id || cat.id || '') as string;
              const isSelected = selectedCategory === cId;
              const count = categoryCountMap[cId] || 0;

              return (
                <button
                  key={cId}
                  onClick={() => handleCategoryChange(cId)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25 ring-2 ring-sky-600/30'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filter Chips */}
        {(searchQuery || selectedCategory !== 'all') && (
          <div className="pt-2 flex items-center gap-2 flex-wrap text-xs">
            <span className="font-bold text-slate-400">Active filters:</span>
            {selectedCategory !== 'all' && activeCategoryObj && (
              <Tag
                closable
                onClose={() => handleCategoryChange('all')}
                color="blue"
                className="font-bold rounded-lg px-2.5 py-1 text-xs"
              >
                Department: {activeCategoryObj.name}
              </Tag>
            )}
            {searchQuery && (
              <Tag
                closable
                onClose={() => handleSearchChange('')}
                color="orange"
                className="font-bold rounded-lg px-2.5 py-1 text-xs"
              >
                Search: "{searchQuery}"
              </Tag>
            )}
            <button
              onClick={() => {
                handleCategoryChange('all');
                handleSearchChange('');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold ml-1 cursor-pointer"
            >
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <CardSkeleton count={8} columns={4} />
      ) : filteredProducts.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <Empty
            description={
              <div className="space-y-2 mt-4">
                <h3 className="text-lg font-bold text-slate-800">No products match your criteria</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try adjusting your search terms or select another category to view available artisan items.
                </p>
                <button
                  onClick={() => {
                    handleCategoryChange('all');
                    handleSearchChange('');
                  }}
                  className="mt-3 px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-sky-700 transition-colors cursor-pointer"
                >
                  Clear Filters & Show All
                </button>
              </div>
            }
          />
        </div>
      ) : selectedCategory === 'all' && !searchQuery ? (
        /* Render Grouped Category-Wise Sections */
        <div className="space-y-12">
          {categoryGroupedProducts.map(({ category, items }) => {
            const cId = (category._id || category.id || '') as string;
            return (
              <section key={`group-${cId}`} className="space-y-4">
                {/* Category Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-black text-sm border border-sky-100 shrink-0">
                      <AppstoreOutlined />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        {category.name}
                      </h2>
                      <p className="text-xs font-semibold text-slate-400">
                        {category.description || `Handcrafted goods in ${category.name}`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCategoryChange(cId)}
                    className="text-xs font-bold text-sky-600 hover:text-sky-800 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl border border-sky-200/60"
                  >
                    <span>View All {category.name} ({items.length})</span>
                    <span>→</span>
                  </button>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {items.map((p) => {
                    const pId = p._id || p.id;
                    const finalPrice = p.salePrice ?? p.price;
                    return (
                      <div
                        key={`cat-prod-${pId}`}
                        onClick={() => navigate(`/product/${pId}`)}
                        className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col justify-between"
                      >
                        <div className="aspect-square bg-slate-100 overflow-hidden relative">
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80'}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {p.salePrice && (
                            <span className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-xs">
                              Sale
                            </span>
                          )}
                        </div>

                        <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-1 text-xs mb-1">
                              <div className="flex items-center gap-1 text-amber-500 font-bold">
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
                            <h4 className="font-bold text-slate-900 text-sm group-hover:text-sky-600 transition-colors line-clamp-1">
                              {p.name}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                              {p.description}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div>
                              <div className="font-black text-slate-900 text-base">
                                ${finalPrice.toFixed(2)}
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
        </div>
      ) : (
        /* Render Standard Flat Grid (Filtered by Category or Search) */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Showing {filteredProducts.length} results</span>
            {searchQuery && (
              <span>Filtered by keyword: <strong className="text-slate-800">"{searchQuery}"</strong></span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((p) => {
              const pId = p._id || p.id;
              const finalPrice = p.salePrice ?? p.price;
              return (
                <div
                  key={`flat-prod-${pId}`}
                  onClick={() => navigate(`/product/${pId}`)}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col justify-between"
                >
                  <div className="aspect-square bg-slate-100 overflow-hidden relative">
                    <img
                      src={p.images?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80'}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {p.salePrice && (
                      <span className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-xs">
                        Sale
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 text-xs mb-1">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
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
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-sky-600 transition-colors line-clamp-1">
                        {p.name}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {p.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="font-black text-slate-900 text-base">
                          ${finalPrice.toFixed(2)}
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
        </div>
      )}
    </div>
  );
};

export default CategoryProductsPage;
