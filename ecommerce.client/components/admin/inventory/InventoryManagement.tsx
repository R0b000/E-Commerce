import React, { useEffect, useState, useMemo } from 'react';
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
} from '@ant-design/icons';
import { Tag, Spin, Tooltip, Progress } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { Product, Category } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import {
  AppCard,
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

  return (
    <div className="space-y-6 w-full font-['Poppins','Inter',sans-serif]">
      {/* Page Header */}
      <PageHeader
        title="Inventory & Stock Management"
        description="Monitor real-time warehouse inventory, stock thresholds, low-stock alerts, and batch adjustments."
        breadcrumbs={[{ label: 'Admin', path: '/admin' }, { label: 'Inventory' }]}
      />

      {/* Main Inventory Directory Card (Border removed) */}
      <AppCard
        bordered={false}
        className="overflow-hidden !border-0 !border-none rounded-2xl shadow-xs p-0"
        style={{ border: 'none', borderColor: 'transparent' }}
      >
        {/* Table Top Controls & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Warehouse Stock Ledger
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
              {filteredProducts.length} Items
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Health Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setHealthFilter('all')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  healthFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setHealthFilter('healthy')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  healthFilter === 'healthy' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                In Stock (&gt;10)
              </button>
              <button
                onClick={() => setHealthFilter('low')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  healthFilter === 'low' ? 'bg-white text-[#f97316] shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Low (1-10)
              </button>
              <button
                onClick={() => setHealthFilter('out')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  healthFilter === 'out' ? 'bg-white text-rose-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Out of Stock
              </button>
            </div>

            {/* Category Dropdown */}
            <AppSelect
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val as string)}
              style={{ width: 180 }}
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

            {/* Search Input */}
            <div className="w-full sm:w-[350px] max-w-[350px] shrink-0">
              <AppInput
                prefix={<SearchOutlined className="text-slate-400" />}
                placeholder="Search inventory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
              />
            </div>
          </div>
        </div>

        {/* Inventory Stock Table */}
        <AppTable>
          <thead>
              <tr>
                <th className="py-2.5 px-6 font-medium text-[12px]">Product & SKU</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Category</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Stock Level & Status</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Unit Price</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Asset Value</th>
                <th className="py-2.5 px-6 text-right font-medium text-[12px]">Quick Restock Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton columns={6} rows={6} hasAvatar={false} />
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No products found matching your inventory filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const pId = (p._id || p.id) as string;
                  const price = p.salePrice ?? p.price;
                  const assetValue = (p.stock || 0) * price;
                  const isLow = p.stock > 0 && p.stock <= 5;
                  const isOut = p.stock <= 0;
                  const categoryName = typeof p.category === 'object' ? (p.category as any)?.name : 'Catalog';

                  return (
                    <tr
                      key={pId}
                      className="hover:bg-slate-50/70 transition-colors group cursor-default"
                    >
                      {/* Product & SKU */}
                      <td className="py-4 px-6 whitespace-nowrap">
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
                      <td className="py-4 px-4 whitespace-nowrap">
                        <Tag className="m-0 font-semibold text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 border-slate-200 text-slate-700">
                          {categoryName}
                        </Tag>
                      </td>

                      {/* Stock Level & Status */}
                      <td className="py-4 px-4 whitespace-nowrap min-w-[180px]">
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
                      <td className="py-4 px-4 whitespace-nowrap font-semibold text-slate-800">
                        ${price.toFixed(2)}
                      </td>

                      {/* Total Asset Value */}
                      <td className="py-4 px-4 whitespace-nowrap font-black text-slate-900">
                        ${assetValue.toFixed(2)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Fast +10 */}
                          <button
                            onClick={() => handleQuickRestock(pId, p.stock, 10)}
                            className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 font-bold text-[11px] text-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="Add 10 units"
                          >
                            +10
                          </button>

                          {/* Fast +25 */}
                          <button
                            onClick={() => handleQuickRestock(pId, p.stock, 25)}
                            className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 font-bold text-[11px] text-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="Add 25 units"
                          >
                            +25
                          </button>

                          {/* Fast +50 */}
                          <button
                            onClick={() => handleQuickRestock(pId, p.stock, 50)}
                            className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 font-bold text-[11px] text-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="Add 50 units"
                          >
                            +50
                          </button>

                          {/* Custom Adjust Modal Button */}
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setAdjustAmount(10);
                              setAdjustType('add');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-slate-200 hover:bg-orange-50 hover:text-[#f97316] hover:border-orange-300 font-semibold text-xs text-slate-700 transition-all cursor-pointer shadow-2xs ml-1"
                          >
                            <EditOutlined className="text-xs" />
                            <span>Adjust</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
        </AppTable>
      </AppCard>

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
