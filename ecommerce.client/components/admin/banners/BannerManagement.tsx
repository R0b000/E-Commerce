import React, { useEffect, useState } from 'react';
import {
  PictureOutlined,
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ThunderboltFilled,
  CalendarOutlined,
  LinkOutlined,
  RiseOutlined,
  UploadOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import {
  Tag,
  Popconfirm,
  Switch,
  Breadcrumb,
  Select,
  DatePicker,
  TimePicker,
  Checkbox,
  Upload,
  Tabs,
  Tooltip,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { ecommerceService } from '../../../services/EcommerceAPIService';
import { BannerItem, BannerStats } from '../../../types/ecommerce.types';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../context/PermissionContext';
import {
  AppCard,
  AppButton,
  AppInput,
  AppTable,
  AppModal,
} from 'shared-components';

const { RangePicker } = DatePicker;

export const BannerManagement: React.FC = () => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [stats, setStats] = useState<BannerStats>({
    activeNowCount: 0,
    scheduledCount: 0,
    totalImpressions: 0,
    totalClicks: 0,
    avgCtr: '0.0',
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Quick Preview Modal
  const [previewBanner, setPreviewBanner] = useState<BannerItem | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    badgeText: '',
    imageUrl: '',
    ctaText: 'Shop Now',
    ctaLink: '/#catalog',
    secondaryCtaText: '',
    secondaryCtaLink: '',
    position: 'hero_main' as 'hero_main' | 'hero_secondary' | 'top_announcement' | 'flash_sale',
    alignment: 'left' as 'left' | 'center' | 'right',
    overlayOpacity: 45,
    scheduleType: 'always' as 'always' | 'date_range' | 'recurring_daily' | 'recurring_weekly',
    startDate: null as Dayjs | null,
    endDate: null as Dayjs | null,
    startHour: 0,
    endHour: 23,
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    priority: 5,
    isActive: true,
  });

  const { showToast } = useToast();
  const { hasPermission } = usePermissions();

  const loadBanners = async () => {
    setLoading(true);
    try {
      const res = await ecommerceService.getBanners({
        search,
        position: positionFilter,
        status: statusFilter,
        page,
        limit,
      });
      if (res.success && res.data) {
        setBanners(res.data.banners);
        setTotal(res.data.pagination.total);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      } else {
        showToast(res.messages?.[0] || 'Failed to fetch banners', 'error');
      }
    } catch {
      showToast('Error connecting to banner service', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, [search, positionFilter, statusFilter, page, limit]);

  const handleOpenCreateModal = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      badgeText: 'Handcrafted in Nepal • Ethically Sourced',
      imageUrl: '',
      ctaText: 'Shop Now',
      ctaLink: '/#catalog',
      secondaryCtaText: '',
      secondaryCtaLink: '',
      position: 'hero_main',
      alignment: 'left',
      overlayOpacity: 45,
      scheduleType: 'always',
      startDate: null,
      endDate: null,
      startHour: 0,
      endHour: 23,
      activeDays: [0, 1, 2, 3, 4, 5, 6],
      priority: 5,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (banner: BannerItem) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      badgeText: banner.badgeText || '',
      imageUrl: banner.imageUrl,
      ctaText: banner.ctaText || 'Shop Now',
      ctaLink: banner.ctaLink || '/#catalog',
      secondaryCtaText: banner.secondaryCtaText || '',
      secondaryCtaLink: banner.secondaryCtaLink || '',
      position: banner.position || 'hero_main',
      alignment: banner.alignment || 'left',
      overlayOpacity: banner.overlayOpacity ?? 45,
      scheduleType: banner.scheduleType || 'always',
      startDate: banner.startDate ? dayjs(banner.startDate) : null,
      endDate: banner.endDate ? dayjs(banner.endDate) : null,
      startHour: banner.startHour ?? 0,
      endHour: banner.endHour ?? 23,
      activeDays: banner.activeDays && banner.activeDays.length > 0 ? banner.activeDays : [0, 1, 2, 3, 4, 5, 6],
      priority: banner.priority ?? 5,
      isActive: banner.isActive,
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const res = await ecommerceService.uploadImage(file, 'HimalayaOnlineShop');
      if (res.success && res.data?.url) {
        setFormData((prev) => ({ ...prev, imageUrl: res.data.url }));
        showToast('Banner image uploaded to Cloudinary successfully', 'success');
      } else {
        showToast(res.messages?.[0] || 'Image upload failed', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Failed to upload image', 'error');
    } finally {
      setUploadingImage(false);
    }
    return false;
  };

  const handleToggleActive = async (banner: BannerItem) => {
    try {
      const res = await ecommerceService.updateBanner(banner._id, {
        isActive: !banner.isActive,
      });
      if (res.success) {
        showToast(`Banner "${banner.title}" is now ${!banner.isActive ? 'active' : 'inactive'}`, 'success');
        loadBanners();
      } else {
        showToast(res.messages?.[0] || 'Failed to toggle status', 'error');
      }
    } catch {
      showToast('Error updating banner status', 'error');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      const res = await ecommerceService.deleteBanner(id);
      if (res.success) {
        showToast('Banner deleted successfully', 'success');
        loadBanners();
      } else {
        showToast(res.messages?.[0] || 'Failed to delete banner', 'error');
      }
    } catch {
      showToast('Error deleting banner', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Please provide a banner headline / title', 'error');
      return;
    }
    if (!formData.imageUrl.trim()) {
      showToast('Please upload or specify a banner background image URL', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<BannerItem> = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        badgeText: formData.badgeText.trim(),
        imageUrl: formData.imageUrl.trim(),
        ctaText: formData.ctaText.trim(),
        ctaLink: formData.ctaLink.trim(),
        secondaryCtaText: formData.secondaryCtaText.trim(),
        secondaryCtaLink: formData.secondaryCtaLink.trim(),
        position: formData.position,
        alignment: formData.alignment,
        overlayOpacity: Number(formData.overlayOpacity),
        scheduleType: formData.scheduleType,
        startDate: formData.startDate ? formData.startDate.toISOString() : null,
        endDate: formData.endDate ? formData.endDate.toISOString() : null,
        startHour: Number(formData.startHour),
        endHour: Number(formData.endHour),
        activeDays: formData.activeDays,
        priority: Number(formData.priority),
        isActive: formData.isActive,
      };

      let res;
      if (editingBanner) {
        res = await ecommerceService.updateBanner(editingBanner._id, payload);
      } else {
        res = await ecommerceService.createBanner(payload);
      }

      if (res.success) {
        showToast(editingBanner ? 'Banner updated successfully' : 'Banner created successfully', 'success');
        setIsModalOpen(false);
        loadBanners();
      } else {
        showToast(res.messages?.[0] || 'Failed to save banner', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.messages?.[0] || 'Error saving banner', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = (banner: BannerItem) => {
    if (!banner.isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
          <StopOutlined /> INACTIVE
        </span>
      );
    }

    switch (banner.computedStatus) {
      case 'active_now':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            LIVE NOW
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <ClockCircleOutlined className="text-sky-600" />
            SCHEDULED
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <StopOutlined className="text-rose-500" />
            EXPIRED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircleOutlined /> LIVE
          </span>
        );
    }
  };

  const columns = [
    {
      title: 'Banner & Content',
      key: 'banner',
      width: '32%',
      render: (_: any, record: BannerItem) => (
        <div className="flex items-center gap-3">
          <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-xs">
            <img
              src={record.imageUrl}
              alt={record.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80';
              }}
            />
            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white backdrop-blur-xs">
              {record.alignment}
            </div>
          </div>
          <div className="min-w-0">
            {record.badgeText && (
              <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider truncate mb-0.5 flex items-center gap-1">
                <ThunderboltFilled className="text-amber-500" /> {record.badgeText}
              </div>
            )}
            <div className="font-bold text-xs text-slate-900 truncate" title={record.title}>
              {record.title}
            </div>
            {record.subtitle && (
              <div className="text-[11px] text-slate-500 truncate" title={record.subtitle}>
                {record.subtitle}
              </div>
            )}
            <div className="mt-1 flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                {record.position}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Timing & Schedule',
      key: 'schedule',
      width: '24%',
      render: (_: any, record: BannerItem) => (
        <div className="space-y-1">
          <div>{renderStatusBadge(record)}</div>
          <div className="text-[11px] text-slate-700 font-medium">
            {record.scheduleType === 'always' && <span className="text-slate-500">Always Active (24/7)</span>}
            {record.scheduleType === 'date_range' && (
              <div className="space-y-0.5 text-[10px]">
                <div className="text-slate-600">
                  <span className="font-semibold text-slate-800">From:</span>{' '}
                  {record.startDate ? dayjs(record.startDate).format('MMM D, YYYY h:mm A') : 'Immediate'}
                </div>
                <div className="text-slate-600">
                  <span className="font-semibold text-slate-800">Until:</span>{' '}
                  {record.endDate ? dayjs(record.endDate).format('MMM D, YYYY h:mm A') : 'No expiry'}
                </div>
              </div>
            )}
            {record.scheduleType === 'recurring_daily' && (
              <div className="text-[10px] text-slate-600">
                Daily slot: <span className="font-bold text-slate-800">{String(record.startHour).padStart(2, '0')}:00 - {String(record.endHour).padStart(2, '0')}:00</span>
              </div>
            )}
            {record.scheduleType === 'recurring_weekly' && (
              <div className="text-[10px] text-slate-600">
                Weekly: <span className="font-semibold text-slate-800">{record.activeDays?.length} days</span> • {String(record.startHour).padStart(2, '0')}:00 - {String(record.endHour).padStart(2, '0')}:00
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Call to Action',
      key: 'cta',
      width: '14%',
      render: (_: any, record: BannerItem) => (
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">
            <LinkOutlined /> {record.ctaText || 'Shop Now'}
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]" title={record.ctaLink}>
            {record.ctaLink || '/#catalog'}
          </div>
        </div>
      ),
    },
    {
      title: 'Priority',
      key: 'priority',
      width: '8%',
      render: (_: any, record: BannerItem) => (
        <span className="px-2 py-1 rounded-md text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200">
          P-{record.priority ?? 1}
        </span>
      ),
    },
    {
      title: 'Engagement',
      key: 'analytics',
      width: '10%',
      render: (_: any, record: BannerItem) => {
        const ctr = record.impressions > 0 ? ((record.clicks / record.impressions) * 100).toFixed(1) : '0.0';
        return (
          <div className="text-[11px] space-y-0.5">
            <div className="text-slate-600">
              <span className="font-semibold text-slate-800">{(record.impressions || 0).toLocaleString()}</span> imp
            </div>
            <div className="text-slate-600">
              <span className="font-semibold text-slate-800">{(record.clicks || 0).toLocaleString()}</span> clicks
            </div>
            <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
              <RiseOutlined /> {ctr}% CTR
            </div>
          </div>
        );
      },
    },
    {
      title: 'Active',
      key: 'isActive',
      width: '6%',
      render: (_: any, record: BannerItem) => (
        <Switch
          size="small"
          checked={record.isActive}
          onChange={() => handleToggleActive(record)}
          className="bg-slate-300"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '6%',
      render: (_: any, record: BannerItem) => (
        <div className="flex items-center gap-1.5">
          <Tooltip title="Live Preview">
            <button
              onClick={() => setPreviewBanner(record)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
            >
              <EyeOutlined className="text-sm" />
            </button>
          </Tooltip>
          <Tooltip title="Edit Banner">
            <button
              onClick={() => handleOpenEditModal(record)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 transition-colors cursor-pointer"
            >
              <EditOutlined className="text-sm" />
            </button>
          </Tooltip>
          <Popconfirm
            title="Delete Banner"
            description={`Are you sure you want to permanently delete "${record.title}"?`}
            onConfirm={() => handleDeleteBanner(record._id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete Banner">
              <button className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer">
                <DeleteOutlined className="text-sm" />
              </button>
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const daysOfWeek = [
    { label: 'Sun', value: 0 },
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { title: <span className="text-slate-400">Admin</span> },
          { title: <span className="font-semibold text-slate-700">Hero & Banner Management</span> },
        ]}
      />

      {/* Header & Metric Cards */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <PictureOutlined className="text-sky-600" />
              Hero Section & Promotional Banners
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Design, schedule, and automate promotional hero banners with real-time schedule, day slots, and campaign priorities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <AppButton
              type="primary"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm"
            >
              <PlusOutlined />
              <span>Create Banner</span>
            </AppButton>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-800 mb-1">
              <span>Active Right Now</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="text-2xl font-black text-emerald-950">{stats.activeNowCount}</div>
            <div className="text-[11px] text-emerald-700/80 mt-0.5">Currently serving shoppers</div>
          </div>

          <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-100">
            <div className="flex items-center justify-between text-xs font-bold text-sky-800 mb-1">
              <span>Scheduled Upcoming</span>
              <ClockCircleOutlined className="text-sky-600" />
            </div>
            <div className="text-2xl font-black text-sky-950">{stats.scheduledCount}</div>
            <div className="text-[11px] text-sky-700/80 mt-0.5">Automated future releases</div>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100">
            <div className="flex items-center justify-between text-xs font-bold text-purple-800 mb-1">
              <span>Total Impressions</span>
              <EyeOutlined className="text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-950">{stats.totalImpressions.toLocaleString()}</div>
            <div className="text-[11px] text-purple-700/80 mt-0.5">Storefront hero views</div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100">
            <div className="flex items-center justify-between text-xs font-bold text-amber-800 mb-1">
              <span>Clicks & CTR</span>
              <RiseOutlined className="text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-950">
              {stats.totalClicks.toLocaleString()} <span className="text-sm font-bold text-amber-700">({stats.avgCtr}%)</span>
            </div>
            <div className="text-[11px] text-amber-700/80 mt-0.5">Average conversion rate</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative w-full max-w-sm">
            <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Search by title, subtitle, or badge..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-600"
            />
          </div>

          <Select
            value={positionFilter}
            onChange={(val) => {
              setPositionFilter(val);
              setPage(1);
            }}
            className="w-48 text-xs"
            options={[
              { label: 'All Positions', value: 'all' },
              { label: 'Hero Main (Storefront)', value: 'hero_main' },
              { label: 'Secondary Hero', value: 'hero_secondary' },
              { label: 'Top Announcement', value: 'top_announcement' },
              { label: 'Flash Sale Banner', value: 'flash_sale' },
            ]}
          />

          <Select
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            className="w-44 text-xs"
            options={[
              { label: 'All Statuses', value: 'all' },
              { label: 'Live Right Now', value: 'active_now' },
              { label: 'Scheduled Upcoming', value: 'scheduled' },
              { label: 'Expired', value: 'expired' },
              { label: 'Inactive / Paused', value: 'inactive' },
            ]}
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{banners.length}</span> of {total} banners
        </div>
      </div>

      {/* AppTable with Cyan Footer & Paginator */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <AppTable
          columns={columns}
          data={banners}
          loading={loading}
          rowKey="_id"
          pagination={false}
        />

        {/* Signature Cyan 30px Footer */}
        <div className="h-[30px] bg-[#0096C7] px-4 flex items-center justify-between text-white text-xs select-none">
          <div className="flex items-center gap-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Banners: {total}</span>
            <span className="text-white/60">•</span>
            <span className="text-[11px] text-white/90">Page {page} of {Math.ceil(total / limit) || 1}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px]">
              <span>Rows:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-white/20 text-white font-semibold text-[11px] rounded px-1.5 py-0.5 border-none outline-none cursor-pointer"
              >
                <option value={5} className="text-slate-800">5</option>
                <option value={10} className="text-slate-800">10</option>
                <option value={20} className="text-slate-800">20</option>
                <option value={50} className="text-slate-800">50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2 py-0.5 bg-white/20 hover:bg-white/30 disabled:opacity-40 rounded text-[11px] font-bold cursor-pointer transition-colors"
              >
                ‹ Prev
              </button>
              <button
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage((p) => p + 1)}
                className="px-2 py-0.5 bg-white/20 hover:bg-white/30 disabled:opacity-40 rounded text-[11px] font-bold cursor-pointer transition-colors"
              >
                Next ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <AppModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
            <PictureOutlined className="text-sky-600" />
            <span>{editingBanner ? 'Edit Promotional Banner' : 'Create New Promotional Banner'}</span>
          </div>
        }
        footer={null}
        width={780}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs
            defaultActiveKey="content"
            items={[
              {
                key: 'content',
                label: 'Banner Content & Media',
                children: (
                  <div className="space-y-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Headline / Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Authentic Himalayan Craftsmanship, Direct to Your Door"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Subtitle / Description
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Explore hand-hammered singing bowls, organic high-altitude teas, and artisan crafts."
                        value={formData.subtitle}
                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Badge / Tagline (Upper Chip)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Handcrafted in Nepal • Ethically Sourced"
                          value={formData.badgeText}
                          onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Display Position
                        </label>
                        <Select
                          value={formData.position}
                          onChange={(val) => setFormData({ ...formData, position: val })}
                          className="w-full text-xs"
                          options={[
                            { label: 'Main Hero Section (Storefront)', value: 'hero_main' },
                            { label: 'Secondary Hero', value: 'hero_secondary' },
                            { label: 'Top Bar Announcement', value: 'top_announcement' },
                            { label: 'Flash Sale Section', value: 'flash_sale' },
                          ]}
                        />
                      </div>
                    </div>

                    {/* Image URL & Upload */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Banner Image <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/... or upload via Cloudinary"
                          value={formData.imageUrl}
                          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                          required
                          className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-600"
                        />
                        <Upload
                          beforeUpload={(file) => {
                            handleImageUpload(file);
                            return false;
                          }}
                          showUploadList={false}
                          accept="image/*"
                        >
                          <AppButton
                            disabled={uploadingImage}
                            className="px-3 py-2 text-xs flex items-center gap-1.5"
                          >
                            {uploadingImage ? <LoadingOutlined /> : <UploadOutlined />}
                            <span>Upload</span>
                          </AppButton>
                        </Upload>
                      </div>

                      {formData.imageUrl && (
                        <div className="mt-2 relative w-full h-24 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                          <img
                            src={formData.imageUrl}
                            alt="Banner preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Primary CTA Button Label
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Shop Now"
                          value={formData.ctaText}
                          onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Primary CTA Link URL
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. /#catalog or /shop?category=teas"
                          value={formData.ctaLink}
                          onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Secondary CTA Button Label (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Featured Items"
                          value={formData.secondaryCtaText}
                          onChange={(e) => setFormData({ ...formData, secondaryCtaText: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Secondary CTA Link URL
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. /#featured"
                          value={formData.secondaryCtaLink}
                          onChange={(e) => setFormData({ ...formData, secondaryCtaLink: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Text Alignment
                        </label>
                        <Select
                          value={formData.alignment}
                          onChange={(val) => setFormData({ ...formData, alignment: val })}
                          className="w-full text-xs"
                          options={[
                            { label: 'Left Aligned', value: 'left' },
                            { label: 'Center Aligned', value: 'center' },
                            { label: 'Right Aligned', value: 'right' },
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Dark Overlay Opacity ({formData.overlayOpacity}%)
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={90}
                          value={formData.overlayOpacity}
                          onChange={(e) => setFormData({ ...formData, overlayOpacity: Number(e.target.value) })}
                          className="w-full accent-cyan-600"
                        />
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'schedule',
                label: 'Auto Time Scheduling',
                children: (
                  <div className="space-y-4 pt-1">
                    <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-xs text-sky-800 flex items-start gap-2">
                      <ClockCircleOutlined className="text-sky-600 text-sm mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold">Automated Scheduling:</span> The system checks the current server time and automatically displays banners only when their scheduled window is valid.
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Schedule Mode
                      </label>
                      <Select
                        value={formData.scheduleType}
                        onChange={(val) => setFormData({ ...formData, scheduleType: val })}
                        className="w-full text-xs"
                        options={[
                          { label: 'Always Active (24/7 without expiration)', value: 'always' },
                          { label: 'Specific Date & Time Window (e.g. Flash Weekend Sale)', value: 'date_range' },
                          { label: 'Daily Recurring Hour Slot (e.g. Morning 06:00-12:00 or Evening 18:00-23:00)', value: 'recurring_daily' },
                          { label: 'Weekly Day Slots (e.g. Weekend Special Fri/Sat/Sun)', value: 'recurring_weekly' },
                        ]}
                      />
                    </div>

                    {(formData.scheduleType === 'date_range' ||
                      formData.scheduleType === 'recurring_daily' ||
                      formData.scheduleType === 'recurring_weekly') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Start Date & Time
                          </label>
                          <DatePicker
                            showTime
                            value={formData.startDate}
                            onChange={(date) => setFormData({ ...formData, startDate: date })}
                            className="w-full text-xs"
                            placeholder="Start date & time"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            End Date & Time
                          </label>
                          <DatePicker
                            showTime
                            value={formData.endDate}
                            onChange={(date) => setFormData({ ...formData, endDate: date })}
                            className="w-full text-xs"
                            placeholder="End date & time"
                          />
                        </div>
                      </div>
                    )}

                    {(formData.scheduleType === 'recurring_daily' || formData.scheduleType === 'recurring_weekly') && (
                      <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Active Start Hour (24-Hour)
                          </label>
                          <Select
                            value={formData.startHour}
                            onChange={(val) => setFormData({ ...formData, startHour: val })}
                            className="w-full text-xs"
                            options={Array.from({ length: 24 }).map((_, i) => ({
                              label: `${String(i).padStart(2, '0')}:00 (${i === 0 ? 'Midnight' : i === 12 ? 'Noon' : i > 12 ? `${i - 12} PM` : `${i} AM`})`,
                              value: i,
                            }))}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Active End Hour (24-Hour)
                          </label>
                          <Select
                            value={formData.endHour}
                            onChange={(val) => setFormData({ ...formData, endHour: val })}
                            className="w-full text-xs"
                            options={Array.from({ length: 24 }).map((_, i) => ({
                              label: `${String(i).padStart(2, '0')}:00 (${i === 0 ? 'Midnight' : i === 12 ? 'Noon' : i > 12 ? `${i - 12} PM` : `${i} AM`})`,
                              value: i,
                            }))}
                          />
                        </div>
                      </div>
                    )}

                    {formData.scheduleType === 'recurring_weekly' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Active Days of Week
                        </label>
                        <Checkbox.Group
                          options={daysOfWeek}
                          value={formData.activeDays}
                          onChange={(vals) => setFormData({ ...formData, activeDays: vals as number[] })}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Priority Rank (Higher shows first)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={formData.priority}
                          onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-600"
                        />
                      </div>

                      <div className="flex flex-col justify-end">
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                          Status
                        </label>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={formData.isActive}
                            onChange={(checked) => setFormData({ ...formData, isActive: checked })}
                          />
                          <span className="text-xs font-semibold text-slate-700">
                            {formData.isActive ? 'Active & Enabled' : 'Inactive / Paused'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'preview',
                label: 'Storefront Live Preview',
                children: (
                  <div className="pt-2">
                    <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-16/9 sm:aspect-21/9 min-h-[220px] flex items-center p-6 text-white">
                      <img
                        src={formData.imageUrl || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1600&q=80'}
                        alt="Hero preview"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div
                        className="absolute inset-0 bg-black"
                        style={{ opacity: formData.overlayOpacity / 100 }}
                      ></div>
                      <div
                        className={`relative z-10 max-w-xl space-y-3 ${
                          formData.alignment === 'center'
                            ? 'mx-auto text-center'
                            : formData.alignment === 'right'
                            ? 'ml-auto text-right'
                            : 'text-left'
                        }`}
                      >
                        {formData.badgeText && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-amber-200 border border-white/25">
                            <ThunderboltFilled className="text-amber-300" />
                            <span>{formData.badgeText}</span>
                          </div>
                        )}
                        <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                          {formData.title || 'Your Promotional Banner Headline'}
                        </h2>
                        {formData.subtitle && (
                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                            {formData.subtitle}
                          </p>
                        )}
                        <div className={`pt-1 flex flex-wrap gap-2.5 ${formData.alignment === 'center' ? 'justify-center' : formData.alignment === 'right' ? 'justify-end' : ''}`}>
                          <button
                            type="button"
                            className="px-4 py-2 rounded-lg bg-amber-500 font-bold text-xs uppercase tracking-wider text-slate-950 shadow-md"
                          >
                            {formData.ctaText || 'Shop Now'} →
                          </button>
                          {formData.secondaryCtaText && (
                            <button
                              type="button"
                              className="px-4 py-2 rounded-lg bg-white/20 text-white font-bold text-xs uppercase tracking-wider backdrop-blur-md border border-white/30"
                            >
                              {formData.secondaryCtaText}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              },
            ]}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <AppButton
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs"
            >
              Cancel
            </AppButton>
            <AppButton
              type="primary"
              disabled={submitting}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              {submitting ? 'Saving Banner...' : editingBanner ? 'Save Changes' : 'Create Banner'}
            </AppButton>
          </div>
        </form>
      </AppModal>

      {/* Standalone Quick Preview Modal */}
      {previewBanner && (
        <AppModal
          open={!!previewBanner}
          onCancel={() => setPreviewBanner(null)}
          title={
            <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
              <EyeOutlined className="text-sky-600" />
              <span>Live Storefront Preview</span>
            </div>
          }
          footer={null}
          width={840}
        >
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-16/9 sm:aspect-21/9 min-h-[260px] flex items-center p-8 text-white">
              <img
                src={previewBanner.imageUrl}
                alt={previewBanner.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 bg-black"
                style={{ opacity: (previewBanner.overlayOpacity ?? 45) / 100 }}
              ></div>
              <div
                className={`relative z-10 max-w-xl space-y-3.5 ${
                  previewBanner.alignment === 'center'
                    ? 'mx-auto text-center'
                    : previewBanner.alignment === 'right'
                    ? 'ml-auto text-right'
                    : 'text-left'
                }`}
              >
                {previewBanner.badgeText && (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-amber-200 border border-white/25">
                    <ThunderboltFilled className="text-amber-300" />
                    <span>{previewBanner.badgeText}</span>
                  </div>
                )}
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {previewBanner.title}
                </h1>
                {previewBanner.subtitle && (
                  <p className="text-sm text-slate-200 leading-relaxed font-normal">
                    {previewBanner.subtitle}
                  </p>
                )}
                <div className={`pt-2 flex flex-wrap gap-3 ${previewBanner.alignment === 'center' ? 'justify-center' : previewBanner.alignment === 'right' ? 'justify-end' : ''}`}>
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 font-bold text-xs uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/25"
                  >
                    {previewBanner.ctaText || 'Shop Now'} →
                  </button>
                  {previewBanner.secondaryCtaText && (
                    <button
                      type="button"
                      className="px-4 py-2.5 rounded-xl bg-white/15 text-white font-bold text-xs uppercase tracking-wider backdrop-blur-md border border-white/30"
                    >
                      {previewBanner.secondaryCtaText}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Schedule Status:</span>
                <span>{renderStatusBadge(previewBanner)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Schedule Rule:</span>
                <span className="font-medium text-slate-600">{previewBanner.scheduleType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Destination Link:</span>
                <span className="font-mono text-sky-600">{previewBanner.ctaLink}</span>
              </div>
            </div>
          </div>
        </AppModal>
      )}
    </div>
  );
};
