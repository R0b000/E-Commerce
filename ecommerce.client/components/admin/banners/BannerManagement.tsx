import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  DownOutlined,
  LeftOutlined,
  RightOutlined,
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
  Dropdown,
  Steps,
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
  AppSelect,
  AppImageUpload,
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
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Quick Preview Modal
  const [previewBanner, setPreviewBanner] = useState<BannerItem | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    badgeText: '',
    imageUrl: '',
    publicId: '',
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
      publicId: '',
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
    setCurrentStep(0);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (banner: BannerItem) => {
    setEditingBanner(banner);
    setCurrentStep(0);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      badgeText: banner.badgeText || '',
      imageUrl: banner.imageUrl,
      publicId: '',
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
      let finalImageUrl = formData.imageUrl.trim();
      if (
        formData.publicId &&
        (formData.publicId.includes('/Temporary/') || formData.publicId.startsWith('HimalayaOnlineShop/Temporary'))
      ) {
        try {
          const commitRes = await ecommerceService.commitImage(formData.publicId, 'Admin/Banners');
          if (commitRes.success && commitRes.data?.url) {
            finalImageUrl = commitRes.data.url;
          }
        } catch (err) {
          console.warn('Commit banner image notice:', err);
        }
      }

      const payload: Partial<BannerItem> = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        badgeText: formData.badgeText.trim(),
        imageUrl: finalImageUrl,
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
              title: <span className="text-slate-800 font-bold">Hero Banners</span>,
            },
          ]}
        />
      </div>

      {/* Two-Column Responsive Layout: Left Table Directory + Right Summary & Actions (Independent Scroll) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row items-stretch gap-3 sm:gap-4 overflow-hidden">
        {/* Left Column: Hero & Banners Directory Table */}
        <div className="flex-1 min-w-0 h-full bg-white rounded-t-2xl rounded-b-[2px] shadow-xs overflow-hidden flex flex-col">
          {/* Header Toolbar: Title + Search + Filters */}
          <div className="pl-0 pr-4 py-3 flex items-center justify-between gap-3 bg-white shrink-0">
            <div className="shrink-0">
              <h3 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
                Hero Banners
              </h3>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {/* Search Input */}
              <div className="w-full sm:w-[190px]">
                <AppInput
                  prefix={<SearchOutlined className="text-slate-400" />}
                  placeholder="Search by title, subtitle..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  allowClear
                />
              </div>

              {/* Position Filter */}
              <div className="w-[145px] shrink-0">
                <AppSelect
                  value={positionFilter}
                  onChange={(val) => {
                    setPositionFilter(val as string);
                    setPage(1);
                  }}
                  options={[
                    { label: 'All Positions', value: 'all' },
                    { label: 'Hero Main', value: 'hero_main' },
                    { label: 'Secondary Hero', value: 'hero_secondary' },
                    { label: 'Top Announcement', value: 'top_announcement' },
                    { label: 'Flash Sale', value: 'flash_sale' },
                  ]}
                />
              </div>

              {/* Status Filter */}
              <div className="w-[130px] shrink-0">
                <AppSelect
                  value={statusFilter}
                  onChange={(val) => {
                    setStatusFilter(val as string);
                    setPage(1);
                  }}
                  options={[
                    { label: 'All Statuses', value: 'all' },
                    { label: 'Live Right Now', value: 'active_now' },
                    { label: 'Scheduled', value: 'scheduled' },
                    { label: 'Expired', value: 'expired' },
                    { label: 'Inactive / Paused', value: 'inactive' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Table Body (Independent Scroll Area) */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <AppTable
              columns={columns}
              data={banners}
              loading={loading}
              rowKey="_id"
              pagination={false}
              wrapperClassName="h-full flex-1 flex flex-col min-h-0"
              className="w-full border-collapse"
            />
          </div>

          {/* Table Footer: Matching Brand pagination footer */}
          <div className="px-6 h-[30px] min-h-[30px] bg-[#0096C7] text-white rounded-b-[2px] flex items-center justify-between text-[11px] shadow-inner select-none shrink-0">
            {/* Left Side: Count */}
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-medium text-white/90 text-[11px] leading-none">Total Banners:</span>
              <span className="font-bold text-white text-[11px] leading-none">
                {total} Items
              </span>
            </div>

            {/* Right Side: Pagination Controls */}
            {total > 0 && (
              <div className="flex items-center gap-2.5 leading-none">
                <div className="flex items-center gap-1.5 text-[10px] text-white/95 font-medium leading-none">
                  <span>Items:</span>
                  <Dropdown
                    menu={{
                      items: [
                        { key: '5', label: <span className="font-semibold text-xs text-slate-800">5 / page</span> },
                        { key: '10', label: <span className="font-semibold text-xs text-slate-800">10 / page</span> },
                        { key: '20', label: <span className="font-semibold text-xs text-slate-800">20 / page</span> },
                        { key: '50', label: <span className="font-semibold text-xs text-slate-800">50 / page</span> },
                      ],
                      selectedKeys: [String(limit)],
                      onClick: ({ key }) => {
                        setLimit(Number(key));
                        setPage(1);
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
                      <span>{limit}</span>
                      <DownOutlined className="text-[7px] text-white/85" />
                    </button>
                  </Dropdown>
                </div>

                <span className="text-[10px] text-white/95 font-medium whitespace-nowrap leading-none">
                  {total > 0 ? (page - 1) * limit + 1 : 0}-{Math.min(page * limit, total)} of {total}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    title="Previous page"
                    className="!w-5 !h-5 !min-w-0 !min-h-0 p-0 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 active:bg-white/30 disabled:opacity-30 disabled:hover:bg-white/15 disabled:cursor-not-allowed text-white transition-all cursor-pointer border border-white/20 leading-none"
                  >
                    <LeftOutlined className="text-[8px]" />
                  </button>
                  <button
                    type="button"
                    disabled={page >= Math.ceil(total / limit)}
                    onClick={() => setPage((p) => p + 1)}
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

        {/* Right Column: Create Banner Card + Performance Summary Metrics (Independent Scroll Area) */}
        <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 h-full overflow-y-auto brand-sidebar-scroll space-y-3.5 pr-1">
          {/* Card 1: Create New Banner */}
          <div className="bg-white rounded-2xl shadow-xs px-4 py-3 flex items-center">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="w-full h-[32px] flex items-center justify-center gap-1.5 bg-[#0096C7] hover:bg-[#0083ae] active:bg-[#007096] text-white font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <PlusOutlined className="text-xs" />
              <span>Create New Banner</span>
            </button>
          </div>

          {/* Card 2: Performance Summary (Static Clean View) */}
          <div className="bg-white rounded-2xl shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h4 className="text-xs font-bold text-slate-900">Hero Summary</h4>
              <span className="text-[10px] font-bold text-[#0096C7] bg-sky-50 px-2.5 py-0.5 rounded-full">
                Live Stats
              </span>
            </div>

            <div className="space-y-1">
              {/* Metric 1: Active Right Now */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Active Right Now
                  </span>
                  <span className="text-2xl font-black text-emerald-600 leading-tight block">
                    {stats.activeNowCount}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Serving shoppers
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                  <PictureOutlined />
                </div>
              </div>

              {/* Metric 2: Scheduled Upcoming */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Scheduled Upcoming
                  </span>
                  <span className="text-2xl font-black text-slate-900 leading-tight block">
                    {stats.scheduledCount}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Automated releases
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0096C7] flex items-center justify-center text-lg shrink-0">
                  <ClockCircleOutlined />
                </div>
              </div>

              {/* Metric 3: Total Impressions */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Impressions
                  </span>
                  <span className="text-2xl font-black text-purple-600 leading-tight block">
                    {stats.totalImpressions.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Storefront hero views
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg shrink-0">
                  <EyeOutlined />
                </div>
              </div>

              {/* Metric 4: Clicks & CTR */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 tracking-tight">
                    Clicks (CTR {stats.avgCtr}%)
                  </span>
                  <span className="text-2xl font-black text-amber-600 leading-tight block">
                    {stats.totalClicks.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Avg conversion rate
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg shrink-0">
                  <RiseOutlined />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal (Wide Multi-Step Wizard) */}
      <AppModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        title={
          <div className="flex items-center justify-between pr-6 w-full">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0096C7] flex items-center justify-center text-base border border-sky-100">
                <PictureOutlined />
              </div>
              <div>
                <span>{editingBanner ? 'Edit Promotional Banner' : 'Create Promotional Banner'}</span>
                <span className="block text-[11px] text-slate-400 font-normal">
                  Step {currentStep + 1} of 4 • {['Content & Placement', 'Media & Actions', 'Scheduling & Priority', 'Live Preview & Confirm'][currentStep]}
                </span>
              </div>
            </div>
            {editingBanner && (
              <Tag color="cyan" className="font-semibold text-xs">
                Editing #{editingBanner._id.slice(-6).toUpperCase()}
              </Tag>
            )}
          </div>
        }
        footer={null}
        width={1060}
      >
        <div className="space-y-5 py-1">
          {/* AntD Step Indicator */}
          <div className="px-2 pt-1 pb-2 border-b border-slate-100">
            <Steps
              current={currentStep}
              onChange={(targetStep) => {
                if (targetStep > currentStep && currentStep === 0 && !formData.title.trim()) {
                  showToast('Please enter a headline / title before proceeding', 'error');
                  return;
                }
                setCurrentStep(targetStep);
              }}
              items={[
                {
                  title: 'Content & Placement',
                  description: 'Headline & alignment',
                  icon: <EditOutlined />,
                },
                {
                  title: 'Media & Actions',
                  description: 'Background & CTAs',
                  icon: <PictureOutlined />,
                },
                {
                  title: 'Scheduling',
                  description: 'Active dates & hours',
                  icon: <ClockCircleOutlined />,
                },
                {
                  title: 'Preview & Launch',
                  description: 'Storefront check',
                  icon: <EyeOutlined />,
                },
              ]}
            />
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Content & Placement */}
            {currentStep === 0 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Headline / Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Authentic Himalayan Craftsmanship, Direct to Your Door"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:border-[#0096C7] focus:ring-1 focus:ring-[#0096C7]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Subtitle / Narrative Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Explore hand-hammered singing bowls, organic high-altitude teas, and artisan crafts."
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#0096C7] focus:ring-1 focus:ring-[#0096C7]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Badge / Tagline Chip (Upper Badge)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Handcrafted in Nepal • Ethically Sourced"
                      value={formData.badgeText}
                      onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#0096C7]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Display Position on Storefront
                    </label>
                    <Select
                      value={formData.position}
                      onChange={(val) => setFormData({ ...formData, position: val })}
                      className="w-full h-[34px] text-xs"
                      options={[
                        { label: 'Main Hero Section (Storefront Top)', value: 'hero_main' },
                        { label: 'Secondary Hero Showcase', value: 'hero_secondary' },
                        { label: 'Top Bar Announcement Banner', value: 'top_announcement' },
                        { label: 'Flash Sale Section', value: 'flash_sale' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Text Alignment
                    </label>
                    <Select
                      value={formData.alignment}
                      onChange={(val) => setFormData({ ...formData, alignment: val })}
                      className="w-full h-[34px] text-xs"
                      options={[
                        { label: 'Left Aligned (Standard)', value: 'left' },
                        { label: 'Center Aligned (Symmetric)', value: 'center' },
                        { label: 'Right Aligned', value: 'right' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dark Contrast Overlay ({formData.overlayOpacity}%)
                    </label>
                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="range"
                        min={0}
                        max={90}
                        value={formData.overlayOpacity}
                        onChange={(e) => setFormData({ ...formData, overlayOpacity: Number(e.target.value) })}
                        className="w-full accent-[#0096C7]"
                      />
                      <span className="text-xs font-mono font-bold text-slate-600 w-10 text-right">
                        {formData.overlayOpacity}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Media & Actions */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <AppImageUpload
                    label="Banner Background Image"
                    value={formData.imageUrl}
                    onChange={(url: string) => {
                      setFormData((prev) => ({
                        ...prev,
                        imageUrl: url,
                      }));
                    }}
                    onUpload={handleImageUpload}
                    loading={uploadingImage}
                  />
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Or direct image URL:</span>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="flex-1 px-3 py-1 text-xs border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:border-[#0096C7]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                      <LinkOutlined className="text-[#0096C7]" />
                      <span>Primary CTA Button</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Shop Now"
                        value={formData.ctaText}
                        onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#0096C7]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Target Link / Route
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. /#catalog or /shop?category=teas"
                        value={formData.ctaLink}
                        onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#0096C7]"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                      <LinkOutlined className="text-slate-400" />
                      <span>Secondary CTA Button (Optional)</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Explore Artisans"
                        value={formData.secondaryCtaText}
                        onChange={(e) => setFormData({ ...formData, secondaryCtaText: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#0096C7]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Target Link / Route
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. /#featured"
                        value={formData.secondaryCtaLink}
                        onChange={(e) => setFormData({ ...formData, secondaryCtaLink: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#0096C7]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Scheduling & Priority */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-xs text-sky-800 flex items-start gap-2">
                  <ClockCircleOutlined className="text-[#0096C7] text-sm mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">Automated Time Scheduler:</span> The system automatically checks server time and shows this banner only during its scheduled active window.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
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
                    <>
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
                    </>
                  )}

                  {(formData.scheduleType === 'recurring_daily' || formData.scheduleType === 'recurring_weekly') && (
                    <div className="md:col-span-2 grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
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
                    <div className="md:col-span-2">
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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Priority Rank (Higher numbers display first)
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
                      Banner Status
                    </label>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.isActive}
                        onChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        {formData.isActive ? 'Active & Published' : 'Inactive / Paused'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Live Storefront Preview & Review */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fadeIn">
                {/* Summary Configuration Chips */}
                <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Tag color="blue" className="font-bold uppercase text-[10px] m-0">
                      Position: {formData.position}
                    </Tag>
                    <Tag color="cyan" className="font-semibold text-[10px] m-0">
                      Schedule: {formData.scheduleType}
                    </Tag>
                    <Tag color="purple" className="font-semibold text-[10px] m-0">
                      Align: {formData.alignment}
                    </Tag>
                    <Tag color={formData.isActive ? 'success' : 'default'} className="font-bold text-[10px] m-0">
                      {formData.isActive ? 'Status: Active' : 'Status: Inactive'}
                    </Tag>
                    <Tag color="orange" className="font-bold text-[10px] m-0">
                      Priority: {formData.priority}
                    </Tag>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Storefront Visual Simulation
                  </span>
                </div>

                {/* Live Responsive Hero Canvas Preview */}
                <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-16/9 sm:aspect-21/9 min-h-[250px] flex items-center p-8 text-white border border-slate-200">
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
                    className={`relative z-10 max-w-2xl space-y-3.5 ${
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
                    <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                      {formData.title || 'Your Promotional Banner Headline'}
                    </h2>
                    {formData.subtitle && (
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                        {formData.subtitle}
                      </p>
                    )}
                    <div className={`pt-2 flex flex-wrap gap-2.5 ${formData.alignment === 'center' ? 'justify-center' : formData.alignment === 'right' ? 'justify-end' : ''}`}>
                      <button
                        type="button"
                        className="px-5 py-2.5 rounded-xl bg-amber-500 font-bold text-xs uppercase tracking-wider text-slate-950 shadow-md transition-transform hover:scale-102"
                      >
                        {formData.ctaText || 'Shop Now'} →
                      </button>
                      {formData.secondaryCtaText && (
                        <button
                          type="button"
                          className="px-4 py-2.5 rounded-xl bg-white/20 text-white font-bold text-xs uppercase tracking-wider backdrop-blur-md border border-white/30 transition-transform hover:scale-102"
                        >
                          {formData.secondaryCtaText}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Navigation Footer */}
            <div className="flex items-center justify-between pt-5 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <LeftOutlined className="text-[10px]" />
                    <span>Previous</span>
                  </button>
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentStep === 0 && !formData.title.trim()) {
                        showToast('Please enter a headline / title for the banner', 'error');
                        return;
                      }
                      setCurrentStep((prev) => prev + 1);
                    }}
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#0096C7] hover:bg-[#0083ae] active:bg-[#007096] rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Next: {['Media & Actions', 'Scheduling', 'Preview & Launch'][currentStep]}</span>
                    <RightOutlined className="text-[10px]" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <CheckCircleOutlined />
                    <span>{submitting ? 'Saving...' : editingBanner ? 'Save Changes' : 'Create & Publish Banner'}</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
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
