import React, { useEffect, useState } from 'react';
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
} from '@ant-design/icons';
import { Tag, Spin, Rate, Popconfirm, Avatar } from 'antd';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { ReviewItem } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import {
  AppCard,
  AppButton,
  AppInput,
  PageHeader,
} from 'shared-components';

export const ReviewManagement: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Customer Reviews & Ratings"
        description="Moderate customer testimonials, monitor store sentiment, and evaluate verified buyer product ratings."
        breadcrumbs={[{ label: 'Admin', path: '/admin' }, { label: 'Reviews' }]}
        extra={
          <AppButton icon={<SyncOutlined />} onClick={loadReviews}>
            Refresh Reviews
          </AppButton>
        }
      />

      {/* Metric Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Reviews
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalReviews}</div>
          <div className="text-xs text-slate-400 mt-1">Across all product listings</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average Score
          </div>
          <div className="text-2xl font-bold text-amber-500 mt-2 flex items-center gap-1.5">
            <span>{avgRating.toFixed(1)}</span>
            <Rate disabled allowHalf value={avgRating} className="text-xs text-amber-500" />
          </div>
          <div className="text-xs text-slate-400 mt-1">Overall customer satisfaction</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Approved & Public
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{approvedCount}</div>
          <div className="text-xs text-slate-400 mt-1">Live on store catalog</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pending Moderation
          </div>
          <div className="text-2xl font-bold text-orange-600 mt-2">{pendingCount}</div>
          <div className="text-xs text-slate-400 mt-1">Awaiting admin sign-off</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <AppCard>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="w-full md:w-[40vw]">
            <AppInput
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product, customer, or comment..."
              allowClear
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { key: 'all', label: 'All Reviews' },
              { key: 'approved', label: '✅ Approved' },
              { key: 'pending', label: '⏳ Pending' },
              { key: 'rejected', label: '⛔ Rejected' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === tab.key
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </AppCard>

      {/* Reviews List */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <Spin size="large" />
          <p className="mt-3 text-sm">Loading customer reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <AppCard>
          <div className="py-12 text-center text-slate-400 text-sm">
            No customer reviews found matching filter.
          </div>
        </AppCard>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => {
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
              <AppCard key={revId} className="hover:shadow-sm transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left: Review details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Rate disabled value={rev.rating} className="text-xs text-amber-500" />
                      <span className="font-bold text-slate-900 text-sm">{rev.rating}.0</span>
                      {rev.title && (
                        <span className="font-bold text-slate-800 text-sm">— {rev.title}</span>
                      )}
                      <Tag
                        className="m-0 font-bold text-[10px] uppercase px-2 py-0.2 rounded-full"
                        color={isApproved ? 'success' : isPending ? 'warning' : 'default'}
                      >
                        {rev.status}
                      </Tag>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                      "{rev.comment}"
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Avatar size="small" style={{ backgroundColor: '#0284c7' }}>
                          {rev.userName?.[0]}
                        </Avatar>
                        {rev.userName}
                      </span>
                      <span className="text-slate-400 font-mono">({rev.userEmail})</span>
                      <span>·</span>
                      <span className="text-slate-800 font-medium">Product: {rev.productName}</span>
                      <span>·</span>
                      <span>{dateStr}</span>
                      {rev.isVerifiedPurchase && (
                        <span className="text-emerald-700 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircleOutlined /> Verified Buyer
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Moderation Actions */}
                  <div className="flex items-center gap-2 shrink-0 md:self-center">
                    {!isApproved && (
                      <AppButton
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        style={{ backgroundColor: '#10b981' }}
                        onClick={() => handleUpdateStatus(revId, 'approved')}
                      >
                        Approve
                      </AppButton>
                    )}

                    {isApproved && (
                      <AppButton
                        type="default"
                        icon={<CloseCircleOutlined />}
                        onClick={() => handleUpdateStatus(revId, 'rejected')}
                      >
                        Reject
                      </AppButton>
                    )}

                    <Popconfirm
                      title="Delete Review"
                      description="Are you sure you want to permanently delete this customer review?"
                      onConfirm={() => handleDelete(revId)}
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                    >
                      <button className="text-slate-400 hover:text-rose-600 p-2 text-sm transition-colors cursor-pointer rounded-lg hover:bg-slate-100">
                        <DeleteOutlined />
                      </button>
                    </Popconfirm>
                  </div>
                </div>
              </AppCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReviewManagement;
