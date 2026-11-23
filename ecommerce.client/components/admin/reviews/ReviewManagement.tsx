import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  StarFilled,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  LeftOutlined,
  RightOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { Tag, Spin, Rate, Popconfirm, Avatar, Breadcrumb, Dropdown } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { ReviewItem } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import {
  AppCard,
  AppButton,
  AppInput,
  AppSelect,
  CardSkeleton,
} from 'shared-components';

export const ReviewManagement: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { showToast } = useToast();

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await ecommerceService.getReviews({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      if (res.success && res.data) {
        setReviews(res.data);
      }
    } catch {
      showToast('Failed to load customer reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await ecommerceService.updateReviewStatus(id, status);
      if (res.success) {
        showToast(`Review marked as ${status}`, 'success');
        setReviews((prev) =>
          prev.map((r) => (r._id === id || r.id === id ? { ...r, status } : r))
        );
      }
    } catch {
      showToast('Failed to update review status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await ecommerceService.deleteReview(id);
      if (res.success) {
        showToast('Review removed successfully', 'success');
        setReviews((prev) => prev.filter((r) => r._id !== id && r.id !== id));
      }
    } catch {
      showToast('Failed to delete review', 'error');
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.userName?.toLowerCase().includes(q) ||
      r.productName?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q) ||
      r.userEmail?.toLowerCase().includes(q)
    );
  });

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 5.0;
  const approvedCount = reviews.filter((r) => r.status === 'approved').length;
  const pendingCount = reviews.filter((r) => r.status === 'pending').length;

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / pageSize));
  const paginatedReviews = filteredReviews.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
              title: <span className="text-slate-800 font-bold">Reviews</span>,
            },
          ]}
        />
      </div>

      {/* Two-Column Responsive Layout: Left Table Directory + Right Summary & Actions (Independent Scroll) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row items-stretch gap-3 sm:gap-4 overflow-hidden">
        {/* Left Column: Customer Reviews Directory */}
        <div className="flex-1 min-w-0 h-full bg-white rounded-t-2xl rounded-b-[2px] shadow-xs overflow-hidden flex flex-col">
          {/* Header Toolbar: Title + Search + Status Filter */}
          <div className="pl-0 pr-4 py-3 flex items-center justify-between gap-3 bg-white shrink-0">
            <div className="shrink-0">
              <h3 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
                Customer Reviews
              </h3>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {/* Search Input */}
              <div className="w-full sm:w-[220px]">
                <AppInput
                  prefix={<SearchOutlined className="text-slate-400" />}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search reviews..."
                  allowClear
                />
              </div>

              {/* Status Filter */}
              <div className="w-[140px] shrink-0">
                <AppSelect
                  value={statusFilter}
                  onChange={(val) => {
                    setStatusFilter(val as string);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: 'All Reviews', value: 'all' },
                    { label: 'Approved', value: 'approved' },
                    { label: 'Pending', value: 'pending' },
                    { label: 'Rejected', value: 'rejected' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Reviews List (Independent Scroll Area) */}
          <div className="flex-1 min-h-0 overflow-y-auto brand-table-scroll p-4 space-y-3 bg-slate-50/40">
            {loading ? (
              <CardSkeleton count={4} columns={2} />
            ) : filteredReviews.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No customer reviews found matching filter.
              </div>
            ) : (
              paginatedReviews.map((rev) => {
                const revId = (rev._id || rev.id || '') as string;
                const dateStr = rev.createdAt
                  ? new Date(rev.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Recent';

                const isApproved = rev.status === 'approved';
                const isPending = rev.status === 'pending';

                return (
                  <div
                    key={revId}
                    className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-xs transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      {/* Left: Review details */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Rate disabled value={rev.rating} className="text-xs text-amber-500" />
                          <span className="font-bold text-slate-900 text-xs">{rev.rating}.0</span>
                          {rev.title && (
                            <span className="font-bold text-slate-800 text-xs truncate max-w-sm">— {rev.title}</span>
                          )}
                          <Tag
                            className="m-0 font-bold text-[10px] uppercase px-2 py-0.2 rounded-full"
                            color={isApproved ? 'success' : isPending ? 'warning' : 'default'}
                          >
                            {rev.status}
                          </Tag>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed">
                          &quot;{rev.comment}&quot;
                        </p>

                        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <Avatar size={20} style={{ backgroundColor: '#0284c7', fontSize: 10 }}>
                              {rev.userName?.[0] || 'U'}
                            </Avatar>
                            <span>{rev.userName}</span>
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">({rev.userEmail})</span>
                          <span>·</span>
                          <span className="text-slate-800 font-medium">Product: {rev.productName}</span>
                          <span>·</span>
                          <span>{dateStr}</span>
                          {rev.isVerifiedPurchase && (
                            <span className="text-emerald-700 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                              <CheckCircleOutlined /> Verified Buyer
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Moderation Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-start md:self-center">
                        {!isApproved && (
                          <AppButton
                            type="primary"
                            size="small"
                            icon={<CheckCircleOutlined />}
                            style={{ backgroundColor: '#10b981' }}
                            onClick={() => handleUpdateStatus(revId, 'approved')}
                            title="Approve Review"
                          />
                        )}

                        {isApproved && (
                          <AppButton
                            type="default"
                            size="small"
                            icon={<CloseCircleOutlined />}
                            onClick={() => handleUpdateStatus(revId, 'rejected')}
                            title="Reject Review"
                          />
                        )}

                        <Popconfirm
                          title="Delete Review"
                          description="Permanently delete this review?"
                          onConfirm={() => handleDelete(revId)}
                          okText="Delete"
                          cancelText="Cancel"
                          okButtonProps={{ danger: true }}
                        >
                          <AppButton
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            title="Delete Review"
                          />
                        </Popconfirm>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Signature Cyan Footer: Matching Brand pagination footer */}
          <div className="px-6 h-[30px] min-h-[30px] bg-[#0096C7] text-white rounded-b-[2px] flex items-center justify-between text-[11px] shadow-inner select-none shrink-0">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-medium text-white/90 text-[11px] leading-none">Total Reviews:</span>
              <span className="font-bold text-white text-[11px] leading-none">
                {filteredReviews.length} Records
              </span>
            </div>

            {filteredReviews.length > 0 && (
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
                  {filteredReviews.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, filteredReviews.length)} of {filteredReviews.length}
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

        {/* Right Column: Refresh Reviews + Review Summary Metrics (Independent Scroll Area) */}
        <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 h-full overflow-y-auto brand-sidebar-scroll space-y-3.5 pr-1">
          {/* Card 1: Refresh Button */}
          <div className="bg-white rounded-2xl shadow-xs px-4 py-3 flex items-center">
            <button
              type="button"
              onClick={loadReviews}
              className="w-full h-[32px] flex items-center justify-center gap-1.5 bg-[#0096C7] hover:bg-[#0083ae] active:bg-[#007096] text-white font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <SyncOutlined className={`text-xs ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Reviews</span>
            </button>
          </div>

          {/* Card 2: Review Summary (Static Clean View) */}
          <div className="bg-white rounded-2xl shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h4 className="text-xs font-bold text-slate-900">Review Summary</h4>
              <span className="text-[10px] font-bold text-[#0096C7] bg-sky-50 px-2.5 py-0.5 rounded-full">
                Live Feedback
              </span>
            </div>

            <div className="space-y-1">
              {/* Metric 1: Total Reviews */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Total Reviews
                  </span>
                  <span className="text-2xl font-black text-slate-900 leading-tight block">
                    {totalReviews}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Across catalog products
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0096C7] flex items-center justify-center text-lg shrink-0">
                  <MessageOutlined />
                </div>
              </div>

              {/* Metric 2: Average Score */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Average Score
                  </span>
                  <span className="text-2xl font-black text-amber-500 leading-tight block">
                    {avgRating.toFixed(1)} / 5.0
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Store customer rating
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-lg shrink-0">
                  <StarFilled />
                </div>
              </div>

              {/* Metric 3: Approved */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Approved & Public
                  </span>
                  <span className="text-2xl font-black text-emerald-600 leading-tight block">
                    {approvedCount}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Live on store pages
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                  <CheckCircleOutlined />
                </div>
              </div>

              {/* Metric 4: Pending Moderation */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Pending Moderation
                  </span>
                  <span className="text-2xl font-black text-orange-600 leading-tight block">
                    {pendingCount}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Awaiting admin review
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg shrink-0">
                  <ClockCircleOutlined />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewManagement;
