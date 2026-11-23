import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AppstoreOutlined,
  SyncOutlined,
  SearchOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  EditOutlined,
  ShopOutlined,
  ThunderboltFilled,
  DownloadOutlined,
  LeftOutlined,
  RightOutlined,
  DownOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { Tag, Spin, Tooltip, Progress, Breadcrumb, Dropdown } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { Product, Category } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import {
  AppTable,
  AppButton,
  AppInput,
  AppSelect,
  AppModal,
  PageHeader,
  TableSkeleton,
} from 'shared-components';

export const InventoryManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState<'all' | 'healthy' | 'low' | 'out'>('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Adjust Stock Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'set'>('add');
  const [adjustAmount, setAdjustAmount] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('Restock Supplier Shipment');
  const [adjusting, setAdjusting] = useState(false);

  const { showToast } = useToast();

  const loadInventory = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        ecommerceService.getProducts({ limit: 100 }),
        ecommerceService.getCategories(),
      ]);

      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data.products);
      }
      if (catRes.success && catRes.data) {
        setCategories(catRes.data);
      }
    } catch {
      showToast('Failed to load inventory catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  // Quick 1-Click Delta Restock
  const handleQuickRestock = async (productId: string, currentStock: number, delta: number) => {
    try {
      const newStock = Math.max(0, currentStock + delta);
      const res = await ecommerceService.updateStock(productId, newStock);
      if (res.success) {
        showToast(`Stock updated (+${delta} units)`, 'success');
        setProducts((prev) =>
          prev.map((p) => {
            const id = (p._id || p.id) as string;
            return id === productId ? { ...p, stock: newStock } : p;
          })
        );
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to update stock', 'error');
    }
  };

  // Custom Modal Adjust Submit
  const handleSaveStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const prodId = (selectedProduct._id || selectedProduct.id) as string;
    const finalStock =
      adjustType === 'add'
        ? Math.max(0, selectedProduct.stock + adjustAmount)
        : Math.max(0, adjustAmount);

    setAdjusting(true);
    try {
      const res = await ecommerceService.updateStock(prodId, finalStock);
      if (res.success) {
        showToast(
          `Inventory updated for ${selectedProduct.name}: ${finalStock} units`,
          'success'
        );
        setProducts((prev) =>
          prev.map((p) => {
            const id = (p._id || p.id) as string;
            return id === prodId ? { ...p, stock: finalStock } : p;
          })
        );
        setSelectedProduct(null);
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to adjust stock', 'error');
    } finally {
      setAdjusting(false);
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q));

      const matchesCat =
        categoryFilter === 'all' ||
        (typeof p.category === 'string' && p.category === categoryFilter) ||
        (typeof p.category === 'object' && ((p.category as any)?._id === categoryFilter || (p.category as any)?.id === categoryFilter));

      let matchesHealth = true;
      if (healthFilter === 'healthy') matchesHealth = p.stock > 10;
      else if (healthFilter === 'low') matchesHealth = p.stock > 0 && p.stock <= 10;
      else if (healthFilter === 'out') matchesHealth = p.stock <= 0;

      return matchesSearch && matchesCat && matchesHealth;
    });
  }, [products, searchQuery, categoryFilter, healthFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
              title: <span className="text-slate-800 font-bold">Inventory</span>,
            },
          ]}
        />
      </div>

      {/* Two-Column Responsive Layout: Left Table Directory + Right Summary & Actions (Independent Scroll) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row items-stretch gap-3 sm:gap-4 overflow-hidden">
        {/* Left Column: Warehouse Stock Ledger Table */}
        <div className="flex-1 min-w-0 h-full bg-white rounded-t-2xl rounded-b-[2px] shadow-xs overflow-hidden flex flex-col">
          {/* Header Toolbar: Title + Health Filter + Category + Search (Single-line Compact) */}
          <div className="pl-0 pr-4 py-3 flex items-center justify-between gap-3 bg-white shrink-0">
            <div className="shrink-0">
              <h3 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
                Warehouse Stock Ledger
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Search Input */}
              <div className="w-[180px] sm:w-[200px]">
                <AppInput
                  prefix={<SearchOutlined className="text-slate-400" />}
                  placeholder="Search inventory..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  allowClear
                />
              </div>

              {/* Category Dropdown */}
              <div className="w-[130px] sm:w-[140px] shrink-0">
                <AppSelect
                  value={categoryFilter}
                  onChange={(val) => {
                    setCategoryFilter(val as string);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: 'All Categories', value: 'all' },
                    ...categories.map((c) => {
                      const cId = (c._id || c.id) as string;
                      return {
                        label: c.name,
                        value: cId,
                      };
                    }),
                  ]}
                />
              </div>

              {/* Stock Health / Level Filter Dropdown */}
              <div className="w-[130px] sm:w-[140px] shrink-0">
                <AppSelect
                  value={healthFilter}
                  onChange={(val) => {
                    setHealthFilter(val as 'all' | 'healthy' | 'low' | 'out');
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: 'All Stock Levels', value: 'all' },
                    { label: 'In Stock (>10)', value: 'healthy' },
                    { label: 'Low Stock (1-10)', value: 'low' },
                    { label: 'Out of Stock (0)', value: 'out' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Content Section: Data Table (Independent Scroll Area) */}
          {loading ? (
            <div className="p-6 flex-1 min-h-0 overflow-y-auto">
              <TableSkeleton columns={6} rows={6} hasAvatar={false} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center flex-1 min-h-0 overflow-y-auto">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-lg">
                <InboxOutlined />
              </div>
              <h4 className="text-sm font-bold text-slate-700">No products found</h4>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your inventory filters or search query.</p>
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
                      Category
                    </th>
                    <th className="sticky top-0 z-20 !bg-[#0096C7] !text-white py-2.5 px-4 font-semibold text-[12px] whitespace-nowrap shadow-xs">
                      Stock Level & Status
                    </th>
                    <th className="sticky top-0 z-20 !bg-[#0096C7] !text-white py-2.5 px-4 font-semibold text-[12px] whitespace-nowrap shadow-xs">
                      Unit Price
                    </th>
                    <th className="sticky top-0 z-20 !bg-[#0096C7] !text-white py-2.5 px-4 font-semibold text-[12px] whitespace-nowrap shadow-xs">
                      Asset Value
                    </th>
                    <th className="sticky top-0 z-20 !bg-[#0096C7] !text-white py-2.5 px-4 font-semibold text-[12px] text-right whitespace-nowrap shadow-xs">
                      Quick Restock Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((p) => {
                    const pId = (p._id || p.id) as string;
                    const price = p.salePrice ?? p.price;
                    const assetValue = (p.stock || 0) * price;
                    const isLow = p.stock > 0 && p.stock <= 5;
                    const isOut = p.stock <= 0;
                    const categoryName = typeof p.category === 'object' ? (p.category as any)?.name : 'Catalog';

                    return (
                      <tr
                        key={pId}
                        className="hover:bg-sky-50/40 transition-colors group cursor-default"
                      >
                        {/* Product & SKU */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                            />
                            <div className="max-w-[220px]">
                              <div className="font-bold text-slate-900 text-xs truncate">
                                {p.name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                SKU: {p.sku || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Tag className="m-0 font-semibold text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 border-slate-200 text-slate-700">
                            {categoryName}
                          </Tag>
                        </td>

                        {/* Stock Level & Status */}
                        <td className="py-3 px-4 whitespace-nowrap min-w-[180px]">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-black ${
                                  isOut
                                    ? 'text-rose-600'
                                    : isLow
                                    ? 'text-[#f97316]'
                                    : 'text-emerald-700'
                                }`}
                              >
                                {p.stock} Units
                              </span>

                              <Tag
                                className="m-0 font-bold text-[10px] uppercase px-2 py-0.2 rounded-md"
                                color={isOut ? 'error' : isLow ? 'orange' : 'success'}
                              >
                                {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Optimal'}
                              </Tag>
                            </div>

                            {/* Stock Health Bar */}
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isOut
                                    ? 'bg-rose-500 w-0'
                                    : isLow
                                    ? 'bg-[#f97316] w-[25%]'
                                    : 'bg-emerald-500 w-[85%]'
                                }`}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Unit Price */}
                        <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-800 text-xs">
                          ${price.toFixed(2)}
                        </td>

                        {/* Total Asset Value */}
                        <td className="py-3 px-4 whitespace-nowrap font-black text-slate-900 text-xs">
                          ${assetValue.toFixed(2)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Fast +10 */}
                            <button
                              type="button"
                              onClick={() => handleQuickRestock(pId, p.stock, 10)}
                              className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-[#0096C7] hover:text-white font-bold text-[11px] text-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
                              title="Add 10 units"
                            >
                              +10
                            </button>

                            {/* Fast +25 */}
                            <button
                              type="button"
                              onClick={() => handleQuickRestock(pId, p.stock, 25)}
                              className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-[#0096C7] hover:text-white font-bold text-[11px] text-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
                              title="Add 25 units"
                            >
                              +25
                            </button>

                            {/* Fast +50 */}
                            <button
                              type="button"
                              onClick={() => handleQuickRestock(pId, p.stock, 50)}
                              className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-[#0096C7] hover:text-white font-bold text-[11px] text-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
                              title="Add 50 units"
                            >
                              +50
                            </button>

                            {/* Custom Adjust Modal Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProduct(p);
                                setAdjustAmount(10);
                                setAdjustType('add');
                              }}
                              title="Adjust Stock"
                              className="inline-flex items-center justify-center p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-orange-50 hover:text-[#f97316] hover:border-orange-300 font-semibold text-xs text-slate-700 transition-all cursor-pointer shadow-2xs ml-1"
                            >
                              <EditOutlined className="text-xs" />
                            </button>
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
              {filteredProducts.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min(currentPage * pageSize, filteredProducts.length)} of {filteredProducts.length}
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

        {/* Right Column: Restock Action Card + Inventory Summary Metrics (Independent Scroll Area) */}
        <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 h-full overflow-y-auto brand-sidebar-scroll space-y-3.5 pr-1">
          {/* Card 1: Add New Stock Item */}
          <div className="bg-white rounded-2xl shadow-xs px-4 py-3 flex items-center">
            <Link
              to="/admin/products?action=new"
              className="w-full h-[32px] flex items-center justify-center gap-1.5 bg-[#0096C7] hover:bg-[#0083ae] active:bg-[#007096] text-white font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <PlusOutlined className="text-xs" />
              <span>New Stock Item</span>
            </Link>
          </div>

          {/* Card 2: Inventory Summary (Static Clean View) */}
          <div className="bg-white rounded-2xl shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h4 className="text-xs font-bold text-slate-900">Inventory Summary</h4>
              <span className="text-[10px] font-bold text-[#0096C7] bg-sky-50 px-2.5 py-0.5 rounded-full">
                Live Metrics
              </span>
            </div>

            <div className="space-y-1">
              {/* Metric 1: Total Stock Units */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Total Units
                  </span>
                  <span className="text-2xl font-black text-slate-900 leading-tight block">
                    {products.reduce((acc, p) => acc + (p.stock || 0), 0)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Units on shelves
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0096C7] flex items-center justify-center text-lg shrink-0">
                  <InboxOutlined />
                </div>
              </div>

              {/* Metric 2: Low Stock Alerts */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Low Stock Alerts
                  </span>
                  <span className="text-2xl font-black text-amber-600 leading-tight block">
                    {products.filter((p) => p.stock > 0 && p.stock <= 10).length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Requires reorder
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg shrink-0">
                  <WarningOutlined />
                </div>
              </div>

              {/* Metric 3: Out of Stock */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Out of Stock
                  </span>
                  <span className="text-2xl font-black text-rose-600 leading-tight block">
                    {products.filter((p) => p.stock <= 0).length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Critical backorders
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg shrink-0">
                  <CloseCircleOutlined />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Adjust Stock Modal (Top-10 Positioned with modal.css) */}
      <AppModal
        open={!!selectedProduct}
        onCancel={() => setSelectedProduct(null)}
        title={`Stock Adjustment: ${selectedProduct?.name}`}
        width="max-w-md"
      >
        <form onSubmit={handleSaveStockAdjustment} className="space-y-4 font-['Poppins','Inter',sans-serif]">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Current Stock On Hand:</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                {selectedProduct?.stock} Units
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">SKU:</div>
              <div className="font-mono text-xs font-bold text-[#0284c7]">
                {selectedProduct?.sku || 'N/A'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Adjustment Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustType('add')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  adjustType === 'add'
                    ? 'border-[#0284c7] bg-blue-50 text-[#0284c7] shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                + Add / Replenish
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('set')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  adjustType === 'set'
                    ? 'border-[#0284c7] bg-blue-50 text-[#0284c7] shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                = Set Exact Count
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {adjustType === 'add' ? 'Units to Add *' : 'New Exact Stock Level *'}
            </label>
            <input
              type="number"
              min="0"
              required
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0284c7] font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Adjustment Reason
            </label>
            <AppSelect
              value={adjustReason}
              onChange={(val) => setAdjustReason(val as string)}
              className="w-full"
              options={[
                { label: 'Restock Supplier Shipment', value: 'Restock Supplier Shipment' },
                { label: 'Customer Return Restock', value: 'Customer Return Restock' },
                { label: 'Physical Cycle Count Audit', value: 'Physical Cycle Count Audit' },
                { label: 'Damaged / Write-Off Deduction', value: 'Damaged / Write-Off Deduction' },
                { label: 'Internal Transfer', value: 'Internal Transfer' },
              ]}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <AppButton type="default" onClick={() => setSelectedProduct(null)}>
              Cancel
            </AppButton>
            <AppButton
              type="primary"
              htmlType="submit"
              loading={adjusting}
              style={{ backgroundColor: '#0284c7' }}
            >
              Apply Adjustment
            </AppButton>
          </div>
        </form>
      </AppModal>
    </div>
  );
};

export default InventoryManagement;
