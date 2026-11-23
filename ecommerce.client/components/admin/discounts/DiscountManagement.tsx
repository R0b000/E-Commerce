import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TagOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CopyOutlined,
  CheckOutlined,
  CalendarOutlined,
  DownOutlined,
  LeftOutlined,
  RightOutlined,
  PercentageOutlined,
  DollarOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import { Tag, Switch, Popconfirm, Select, InputNumber, Breadcrumb, Tooltip, Progress, Dropdown } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { DiscountItem } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import {
  AppTable,
  AppButton,
  AppInput,
  AppSelect,
  AppModal,
  TableSkeleton,
} from 'shared-components';

export const DiscountManagement: React.FC = () => {
  const [discounts, setDiscounts] = useState<DiscountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [formValue, setFormValue] = useState<number>(15);
  const [formMinPurchase, setFormMinPurchase] = useState<number>(0);
  const [formMaxDiscount, setFormMaxDiscount] = useState<number | null>(null);
  const [formUsageLimit, setFormUsageLimit] = useState<number | null>(null);
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [formActive, setFormActive] = useState(true);

  const { showToast } = useToast();

  const loadDiscounts = async () => {
    setLoading(true);
    try {
      const res = await ecommerceService.getDiscounts({
        search: searchQuery || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: currentPage,
        limit: pageSize,
      });

      if (res.success && res.data) {
        setDiscounts(res.data.discounts);
        setTotalCount(res.data.total);
      }
    } catch {
      showToast('Failed to load discount promotional codes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, [searchQuery, typeFilter, statusFilter, currentPage, pageSize]);

  const openAddModal = () => {
    setEditingDiscount(null);
    setFormCode('');
    setFormDescription('');
    setFormType('percentage');
    setFormValue(15);
    setFormMinPurchase(0);
    setFormMaxDiscount(null);
    setFormUsageLimit(null);
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate(
      new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    setFormActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (item: DiscountItem) => {
    setEditingDiscount(item);
    setFormCode(item.code);
    setFormDescription(item.description || '');
    setFormType(item.type);
    setFormValue(item.value);
    setFormMinPurchase(item.minPurchaseAmount || 0);
    setFormMaxDiscount(item.maxDiscountAmount ?? null);
    setFormUsageLimit(item.usageLimit ?? null);
    setFormStartDate(item.startDate ? item.startDate.split('T')[0] : '');
    setFormEndDate(item.endDate ? item.endDate.split('T')[0] : '');
    setFormActive(item.isActive !== false);
    setIsModalOpen(true);
  };

  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) {
      showToast('Discount code is required', 'error');
      return;
    }
    if (formValue <= 0) {
      showToast('Discount value must be greater than zero', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        code: formCode.trim().toUpperCase(),
        description: formDescription.trim(),
        type: formType,
        value: Number(formValue),
        minPurchaseAmount: Number(formMinPurchase) || 0,
        maxDiscountAmount: formType === 'percentage' && formMaxDiscount ? Number(formMaxDiscount) : null,
        usageLimit: formUsageLimit ? Number(formUsageLimit) : null,
        startDate: formStartDate ? new Date(formStartDate).toISOString() : new Date().toISOString(),
        endDate: formEndDate ? new Date(formEndDate).toISOString() : null,
        isActive: formActive,
      };

      if (editingDiscount) {
        const discId = editingDiscount._id || editingDiscount.id || '';
        const res = await ecommerceService.updateDiscount(discId, payload);
        if (res.success) {
          showToast(`Discount code "${formCode.toUpperCase()}" updated successfully`, 'success');
          setIsModalOpen(false);
          loadDiscounts();
        }
      } else {
        const res = await ecommerceService.createDiscount(payload);
        if (res.success) {
          showToast(`Discount code "${formCode.toUpperCase()}" created successfully`, 'success');
          setIsModalOpen(false);
          loadDiscounts();
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to save discount code', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDiscount = async (item: DiscountItem) => {
    const discId = item._id || item.id || '';
    try {
      const res = await ecommerceService.deleteDiscount(discId);
      if (res.success) {
        showToast(`Discount "${item.code}" deleted`, 'success');
        loadDiscounts();
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to delete discount', 'error');
    }
  };

  const handleToggleStatus = async (item: DiscountItem, active: boolean) => {
    const discId = item._id || item.id || '';
    try {
      const res = await ecommerceService.updateDiscount(discId, { isActive: active });
      if (res.success) {
        setDiscounts((prev) =>
          prev.map((d) => ((d._id || d.id) === discId ? { ...d, isActive: active } : d))
        );
        showToast(`Discount code "${item.code}" ${active ? 'activated' : 'deactivated'}`, 'success');
      }
    } catch {
      showToast('Failed to change status', 'error');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Code "${code}" copied to clipboard`, 'info');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Summary Metrics
  const activeDiscounts = discounts.filter((d) => d.isActive !== false && (!d.endDate || new Date(d.endDate) >= new Date())).length;
  const expiredDiscounts = discounts.filter((d) => d.endDate && new Date(d.endDate) < new Date()).length;
  const totalRedemptions = discounts.reduce((acc, d) => acc + (d.usedCount || 0), 0);

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
              title: <span className="text-slate-800 font-bold">Discounts & Coupons</span>,
            },
          ]}
        />
      </div>

      {/* Two-Column Responsive Layout: Left Table Directory + Right Summary & Actions (Independent Scroll) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row items-stretch gap-3 sm:gap-4 overflow-hidden">
        {/* Left Column: Discounts & Coupons Table */}
        <div className="flex-1 min-w-0 h-full bg-white rounded-t-2xl rounded-b-[2px] shadow-xs overflow-hidden flex flex-col">
          {/* Header Toolbar: Title + Search + Filters */}
          <div className="pl-0 pr-4 py-3 flex items-center justify-between gap-3 bg-white shrink-0">
            <div className="shrink-0">
              <h3 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
                Discounts & Coupons
              </h3>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {/* Search Input */}
              <div className="w-full sm:w-[190px]">
                <AppInput
                  prefix={<SearchOutlined className="text-slate-400" />}
                  placeholder="Search code or desc..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  allowClear
                />
              </div>

              {/* Type Filter */}
              <div className="w-[130px] shrink-0">
                <AppSelect
                  value={typeFilter}
                  onChange={(val) => {
                    setTypeFilter(val as string);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: 'All Types', value: 'all' },
                    { label: 'Percentage (%)', value: 'percentage' },
                    { label: 'Fixed Amount ($)', value: 'fixed_amount' },
                  ]}
                />
              </div>

              {/* Status Filter */}
              <div className="w-[125px] shrink-0">
                <AppSelect
                  value={statusFilter}
                  onChange={(val) => {
                    setStatusFilter(val as string);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: 'All Statuses', value: 'all' },
                    { label: 'Active Codes', value: 'active' },
                    { label: 'Disabled', value: 'inactive' },
                    { label: 'Expired', value: 'expired' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Table Body (Independent Scroll Area) */}
          <div className="flex-1 min-h-0 overflow-y-auto brand-table-scroll">
          <AppTable>
            <thead>
              <tr>
                <th className="py-2.5 px-6 font-medium text-[12px]">Promo Code & Description</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Discount Benefit</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Min Order</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Redemption Stats</th>
                <th className="py-2.5 px-4 font-medium text-[12px]">Validity Period</th>
                <th className="py-2.5 px-4 font-medium text-[12px] text-center">Status</th>
                <th className="py-2.5 px-6 text-right font-medium text-[12px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <TableSkeleton columns={7} rows={5} hasAvatar={false} />
              ) : discounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No discount codes found. Click &quot;Add Discount&quot; to create a new promotional coupon.
                  </td>
                </tr>
              ) : (
                discounts.map((disc) => {
                  const discId = disc._id || disc.id;
                  const isExpired = disc.endDate && new Date(disc.endDate) < new Date();
                  const usagePercent = disc.usageLimit
                    ? Math.min(100, Math.round((disc.usedCount / disc.usageLimit) * 100))
                    : 0;

                  return (
                    <tr key={discId} className="hover:bg-slate-50/80 transition-colors">
                      {/* Code & Description */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-base border border-amber-200 shrink-0 mt-0.5">
                            <GiftOutlined />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {disc.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(disc.code)}
                                title="Copy promo code"
                                className="text-slate-400 hover:text-[#0096C7] transition-colors p-0.5 cursor-pointer border-0 bg-transparent"
                              >
                                {copiedCode === disc.code ? (
                                  <CheckOutlined className="text-emerald-500 text-xs" />
                                ) : (
                                  <CopyOutlined className="text-xs" />
                                )}
                              </button>
                            </div>
                            {disc.description && (
                              <p className="text-[11px] text-slate-500 mt-1 max-w-xs truncate">
                                {disc.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Discount Benefit */}
                      <td className="py-3.5 px-4">
                        {disc.type === 'percentage' ? (
                          <div className="space-y-0.5">
                            <Tag className="m-0 text-xs font-bold px-2 py-0.5 rounded-md bg-cyan-50 text-[#0096C7] border-cyan-200">
                              <PercentageOutlined className="mr-1" />
                              {disc.value}% OFF
                            </Tag>
                            {disc.maxDiscountAmount && (
                              <div className="text-[10px] text-slate-400">
                                Cap: ${disc.maxDiscountAmount.toFixed(2)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Tag className="m-0 text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border-emerald-200">
                            <DollarOutlined className="mr-0.5" />
                            ${disc.value.toFixed(2)} OFF
                          </Tag>
                        )}
                      </td>

                      {/* Min Order */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {disc.minPurchaseAmount > 0 ? (
                          `$${disc.minPurchaseAmount.toFixed(2)}`
                        ) : (
                          <span className="text-slate-400 italic">No minimum</span>
                        )}
                      </td>

                      {/* Redemption Stats */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 w-28">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-700">{disc.usedCount}</span>
                            <span className="text-slate-400">
                              / {disc.usageLimit ? `${disc.usageLimit} max` : '∞'}
                            </span>
                          </div>
                          {disc.usageLimit && (
                            <Progress
                              percent={usagePercent}
                              showInfo={false}
                              strokeColor="#0096C7"
                              size="small"
                              className="m-0"
                            />
                          )}
                        </div>
                      </td>

                      {/* Validity Period */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="text-[11px] text-slate-600 font-mono">
                            {disc.endDate
                              ? new Date(disc.endDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Permanent'}
                          </div>
                          {isExpired ? (
                            <Tag className="m-0 text-[9px] font-bold px-1.5 py-0 rounded bg-rose-50 text-rose-700 border-rose-200">
                              Expired
                            </Tag>
                          ) : (
                            <Tag className="m-0 text-[9px] font-medium px-1.5 py-0 rounded bg-slate-100 text-slate-600 border-slate-200">
                              Active Period
                            </Tag>
                          )}
                        </div>
                      </td>

                      {/* Status Switch */}
                      <td className="py-3.5 px-4 text-center">
                        <Switch
                          size="small"
                          checked={disc.isActive !== false && !isExpired}
                          disabled={Boolean(isExpired)}
                          onChange={(checked) => handleToggleStatus(disc, checked)}
                        />
                      </td>

                      {/* Actions (Icon only) */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Tooltip title="Edit Discount">
                            <AppButton
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => openEditModal(disc)}
                            />
                          </Tooltip>

                          <Popconfirm
                            title="Delete Discount"
                            description={`Delete coupon "${disc.code}"?`}
                            onConfirm={() => handleDeleteDiscount(disc)}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                          >
                            <Tooltip title="Delete Discount">
                              <AppButton size="small" danger icon={<DeleteOutlined />} />
                            </Tooltip>
                          </Popconfirm>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </AppTable>
        </div>

        {/* Table Footer: Count on Left, Pagination on Right */}
        <div className="px-6 h-[30px] min-h-[30px] bg-[#0096C7] text-white rounded-b-[2px] flex items-center justify-between text-[11px] shadow-inner select-none shrink-0">
          {/* Left Side: Count */}
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-medium text-white/90 text-[11px] leading-none">Total Discounts:</span>
            <span className="font-bold text-white text-[11px] leading-none">
              {totalCount} Items
            </span>
          </div>

          {/* Right Side: Pagination Controls */}
          {totalCount > 0 && (
            <div className="flex items-center gap-2.5 leading-none">
              <div className="flex items-center gap-1.5 text-[10px] text-white/95 font-medium leading-none">
                <span>Items:</span>
                <Dropdown
                  menu={{
                    items: [
                      { key: '10', label: <span className="font-semibold text-xs text-slate-800">10 / page</span> },
                      { key: '20', label: <span className="font-semibold text-xs text-slate-800">20 / page</span> },
                      { key: '50', label: <span className="font-semibold text-xs text-slate-800">50 / page</span> },
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
                {totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
                {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
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
          )}
        </div>
      </div>

      {/* Right Column: Add Discount Card + Campaign Summary Metrics (Independent Scroll Area) */}
      <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 h-full overflow-y-auto brand-sidebar-scroll space-y-3.5 pr-1">
        {/* Card 1: Add New Discount */}
        <div className="bg-white rounded-2xl shadow-xs px-4 py-3 flex items-center">
          <button
            type="button"
            onClick={openAddModal}
            className="w-full h-[32px] flex items-center justify-center gap-1.5 bg-[#0096C7] hover:bg-[#0083ae] active:bg-[#007096] text-white font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <PlusOutlined className="text-xs" />
            <span>Add New Discount</span>
          </button>
        </div>

        {/* Card 2: Campaign Summary (Static Clean View) */}
        <div className="bg-white rounded-2xl shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-xs font-bold text-slate-900">Campaign Summary</h4>
            <span className="text-[10px] font-bold text-[#0096C7] bg-sky-50 px-2.5 py-0.5 rounded-full">
              Live Promotions
            </span>
          </div>

          <div className="space-y-1">
            {/* Metric 1: Total Coupons */}
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                  Total Coupons
                </span>
                <span className="text-2xl font-black text-slate-900 leading-tight block">
                  {totalCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Configured rules
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0096C7] flex items-center justify-center text-lg shrink-0">
                <TagOutlined />
              </div>
            </div>

            {/* Metric 2: Active Campaigns */}
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                  Active Campaigns
                </span>
                <span className="text-2xl font-black text-emerald-600 leading-tight block">
                  {activeDiscounts}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Live promo codes
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                <CheckOutlined />
              </div>
            </div>

            {/* Metric 3: Total Redemptions */}
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                  Total Redemptions
                </span>
                <span className="text-2xl font-black text-purple-600 leading-tight block">
                  {totalRedemptions}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Customer checkouts
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg shrink-0">
                <GiftOutlined />
              </div>
            </div>

            {/* Metric 4: Expired Codes */}
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                  Expired Codes
                </span>
                <span className="text-2xl font-black text-rose-600 leading-tight block">
                  {expiredDiscounts}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Past end date
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg shrink-0">
                <CalendarOutlined />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Add / Edit Discount Modal */}
      {isModalOpen && (
        <AppModal
          open={isModalOpen}
          title={editingDiscount ? `Edit Coupon: ${editingDiscount.code}` : 'Create New Promotional Coupon'}
          onCancel={() => setIsModalOpen(false)}
          onOk={handleSaveDiscount}
          okText={editingDiscount ? 'Update Discount' : 'Create Discount'}
          confirmLoading={submitting}
          width={650}
        >
          <form onSubmit={handleSaveDiscount} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Promo / Coupon Code *
                </label>
                <AppInput
                  placeholder="e.g. HIMALAYA20, FESTIVE15"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Discount Type *
                </label>
                <Select
                  value={formType}
                  onChange={(val) => setFormType(val)}
                  className="w-full"
                  options={[
                    { label: 'Percentage (%) Off', value: 'percentage' },
                    { label: 'Fixed Amount ($) Off', value: 'fixed_amount' },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  {formType === 'percentage' ? 'Percentage (1 - 100%) *' : 'Amount ($ Off) *'}
                </label>
                <InputNumber
                  min={1}
                  max={formType === 'percentage' ? 100 : 10000}
                  value={formValue}
                  onChange={(val) => setFormValue(val || 1)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Min Purchase ($)
                </label>
                <InputNumber
                  min={0}
                  value={formMinPurchase}
                  onChange={(val) => setFormMinPurchase(val || 0)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Max Cap ($)
                </label>
                <InputNumber
                  min={0}
                  disabled={formType === 'fixed_amount'}
                  placeholder={formType === 'fixed_amount' ? 'N/A' : 'No cap'}
                  value={formMaxDiscount ?? undefined}
                  onChange={(val) => setFormMaxDiscount(val ?? null)}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Campaign Description
              </label>
              <AppInput
                placeholder="e.g. 20% off all artisan singing bowls and organic teas"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Usage Limit (Total)
                </label>
                <InputNumber
                  min={1}
                  placeholder="Unlimited"
                  value={formUsageLimit ?? undefined}
                  onChange={(val) => setFormUsageLimit(val ?? null)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Switch checked={formActive} onChange={setFormActive} />
              <span className="font-semibold text-slate-700">
                Discount Coupon is Active (Can be redeemed during checkout)
              </span>
            </div>
          </form>
        </AppModal>
      )}
    </div>
  );
};

export default DiscountManagement;
